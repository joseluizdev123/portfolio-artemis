<?php
/**
 * Utilitários do tema — o contrato entre os dados (página, CPT, Personalizar) e os templates.
 */

defined( 'ABSPATH' ) || exit;

/** Partes da página, na ordem do index.html estático (= arquivos assets/css/sections/<parte>.css). */
function artemis_pf_partes() {
	return array( 'header', 'portfolio-01-hero', 'portfolio-02-filtro', 'portfolio-03-destaque', 'portfolio-04-projetos', 'portfolio-05-cta', 'footer' );
}

/** URL de um arquivo em assets/. */
function artemis_pf_asset( $path ) {
	return ARTEMIS_PF_URI . '/assets/' . ltrim( $path, '/' );
}

/** ID da página que usa o template Portfólio: a página atual, senão a primeira publicada com o template. */
function artemis_pf_pagina_id() {
	static $id = null;
	if ( null !== $id ) {
		return $id;
	}
	$atual = get_queried_object_id();
	if ( $atual && 'templates/portfolio.php' === get_page_template_slug( $atual ) ) {
		$id = (int) $atual;
		return $id;
	}
	$paginas = get_posts( array(
		'post_type'   => 'page',
		'post_status' => 'publish',
		'meta_key'    => '_wp_page_template', // phpcs:ignore WordPress.DB.SlowDBQuery
		'meta_value'  => 'templates/portfolio.php', // phpcs:ignore WordPress.DB.SlowDBQuery
		'numberposts' => 1,
		'fields'      => 'ids',
	) );
	$id = $paginas ? (int) $paginas[0] : 0;
	return $id;
}

/**
 * Texto de um campo da página (inc/pagina.php): o que foi salvo na página, ou o padrão (texto do design) se estiver vazio.
 */
function artemis_pf_txt( $key ) {
	$campos = artemis_pf_campos_planos();
	$padrao = isset( $campos[ $key ]['padrao'] ) ? $campos[ $key ]['padrao'] : '';
	$id     = artemis_pf_pagina_id();
	if ( $id ) {
		$valor = get_post_meta( $id, '_' . $key, true );
		if ( '' !== (string) $valor ) {
			return (string) $valor;
		}
	}
	return (string) $padrao;
}

/** Escreve um campo da página como texto puro. */
function artemis_pf_e( $key ) {
	echo esc_html( artemis_pf_txt( $key ) );
}

/** Escreve um campo de URL da página. */
function artemis_pf_url( $key ) {
	echo esc_url( artemis_pf_txt( $key ) );
}

/**
 * Texto com {entre chaves} = trecho em cinza (<em>), como no tema oficial. O resto é escapado.
 * Ex.: "Do site institucional {à plataforma}" → Do site institucional <em>à plataforma</em>
 */
function artemis_pf_rico( $texto ) {
	return preg_replace( '/\{([^{}]*)\}/', '<em>$1</em>', esc_html( $texto ) );
}

/** Escreve um campo da página com {trecho em cinza}. */
function artemis_pf_rico_e( $key ) {
	echo artemis_pf_rico( artemis_pf_txt( $key ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- escapado em artemis_pf_rico()
}

/** Valor do Personalizar (header e rodapé) com o padrão de inc/customizer.php. */
function artemis_pf_mod( $key ) {
	$campos = artemis_pf_mod_campos_planos();
	$padrao = isset( $campos[ $key ]['padrao'] ) ? $campos[ $key ]['padrao'] : '';
	$valor  = get_theme_mod( $key, $padrao );
	return '' === (string) $valor ? (string) $padrao : (string) $valor;
}

/* --------------------------------------------------------------------------
   Projetos (CPT art_projeto) e categorias (art_projeto_cat)
   -------------------------------------------------------------------------- */

/** Dados de um projeto no formato usado pelos templates (os mesmos campos de src/projetos.json). */
function artemis_pf_projeto_dados( $post ) {
	$post   = get_post( $post );
	$m      = function ( $k ) use ( $post ) {
		return (string) get_post_meta( $post->ID, $k, true );
	};
	$termos = get_the_terms( $post, 'art_projeto_cat' );
	$img    = null;
	$thumb  = get_post_thumbnail_id( $post );
	if ( $thumb ) {
		$src = wp_get_attachment_image_src( $thumb, 'full' );
		if ( $src ) {
			$img = array( 'src' => $src[0], 'w' => (int) $src[1], 'h' => (int) $src[2] );
		}
	}
	return array(
		'id'           => $post->ID,
		'nome'         => $post->post_title, // cru: get_the_title() aplica wptexturize (aspas/traços) e diferiria do estático
		'dominio'      => $m( '_pf_dominio' ),
		'url'          => $m( '_pf_url' ),
		'cta'          => '' !== $m( '_pf_cta' ) ? $m( '_pf_cta' ) : __( 'Ver site no ar', 'artemis' ),
		'cta_sem_link' => '' !== $m( '_pf_cta_sem_link' ) ? $m( '_pf_cta_sem_link' ) : __( 'Protótipo em breve', 'artemis' ),
		'imagem'       => $img,
		'categorias'   => ( $termos && ! is_wp_error( $termos ) ) ? wp_list_pluck( $termos, 'slug' ) : array(),
		'destaque'     => '1' === $m( '_pf_destaque' ),
		'selo'         => '' !== $m( '_pf_selo' ) ? $m( '_pf_selo' ) : __( 'Em destaque', 'artemis' ),
		'formato'      => $m( '_pf_formato' ),
		'descricao'    => $m( '_pf_descricao' ),
		'fatos'        => array_values( array_filter( array_map( function ( $n ) use ( $m ) {
			$r = $m( '_pf_fato_' . $n . '_rotulo' );
			$v = $m( '_pf_fato_' . $n . '_valor' );
			return ( '' === $r && '' === $v ) ? null : array( $r, $v );
		}, array( 1, 2, 3 ) ) ) ),
		'botao'        => '' !== $m( '_pf_botao' ) ? $m( '_pf_botao' ) : __( 'Ver site no ar', 'artemis' ),
	);
}

/** Todos os projetos publicados, na ordem do campo "Ordem" (menu_order). */
function artemis_pf_todos_projetos() {
	static $todos = null;
	if ( null === $todos ) {
		$todos = array_map( 'artemis_pf_projeto_dados', get_posts( array(
			'post_type'      => 'art_projeto',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'ASC' ),
		) ) );
	}
	return $todos;
}

/** O projeto em destaque: o primeiro marcado (pela ordem), ou null. */
function artemis_pf_destaque() {
	foreach ( artemis_pf_todos_projetos() as $p ) {
		if ( $p['destaque'] ) {
			return $p;
		}
	}
	return null;
}

/** Os projetos da grade: todos menos o destaque. */
function artemis_pf_projetos() {
	$destaque = artemis_pf_destaque();
	return array_values( array_filter( artemis_pf_todos_projetos(), function ( $p ) use ( $destaque ) {
		return ! $destaque || $p['id'] !== $destaque['id'];
	} ) );
}

/** Total de projetos publicados (grade + destaque) — "23 projetos", "Projetos 23", "[ Projetos: 23 ]". */
function artemis_pf_total() {
	return count( artemis_pf_todos_projetos() );
}

/** Categorias das abas, na ordem do campo "Ordem da aba": slug, nome (texto da aba) e plural (rótulo da grade). */
function artemis_pf_categorias() {
	$termos = get_terms( array( 'taxonomy' => 'art_projeto_cat', 'hide_empty' => false ) );
	if ( ! $termos || is_wp_error( $termos ) ) {
		return array();
	}
	$out = array_map( function ( $t ) {
		$plural = (string) get_term_meta( $t->term_id, '_pf_plural', true );
		return array(
			'slug'   => $t->slug,
			'nome'   => $t->name,
			'plural' => '' !== $plural ? $plural : $t->name . 's',
			'ordem'  => (int) get_term_meta( $t->term_id, '_pf_ordem', true ),
		);
	}, $termos );
	usort( $out, function ( $a, $b ) {
		return $a['ordem'] === $b['ordem'] ? strcmp( $a['nome'], $b['nome'] ) : $a['ordem'] - $b['ordem'];
	} );
	return $out;
}

/** "23 projetos" / "1 projeto". */
function artemis_pf_n_projetos( $n ) {
	/* translators: %d: número de projetos */
	return sprintf( _n( '%d projeto', '%d projetos', $n, 'artemis' ), $n );
}

/** Seta "↗" usada nos links (mesmo SVG do design). $traco: espessura do traço. */
function artemis_pf_seta( $tamanho = 16, $traco = '1.5' ) {
	return sprintf(
		'<svg width="%1$d" height="%1$d" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11L11 5M6 5h5v5" stroke="currentColor" stroke-width="%2$s" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
		(int) $tamanho,
		esc_attr( $traco )
	);
}

/**
 * Markup de um cartão da grade — idêntico ao src/partials/card.html montado pelo tools/build.py.
 * $n: número exibido (02, 03…): o 01 é o projeto em destaque.
 */
function artemis_pf_cartao( array $p, $n ) {
	$tem_img = ! empty( $p['imagem'] );
	$alt     = ( $tem_img ? __( 'Captura de tela do projeto ', 'artemis' ) : __( 'Espaço para a captura de tela do projeto ', 'artemis' ) ) . $p['nome'];
	$midia   = $tem_img
		? sprintf( '<img class="pf-shot__img" src="%s" width="%d" height="%d" alt="" loading="lazy" decoding="async">', esc_url( $p['imagem']['src'] ), $p['imagem']['w'], $p['imagem']['h'] )
		: '<p class="pf-shot__label">' . esc_html__( 'Captura do site', 'artemis' ) . '</p>';
	$link    = '' !== $p['url'];
	$acao    = sprintf(
		'<a class="pf-card__go"%s%s>%s' . "\n" . '%s' . "\n" . '</a>',
		$link ? ' href="' . esc_url( $p['url'] ) . '"' : '',
		$link ? ' target="_blank" rel="noopener noreferrer"' : '',
		esc_html( $link ? $p['cta'] : $p['cta_sem_link'] ),
		artemis_pf_seta()
	);
	return '<article class="pf-card" data-categorias="' . esc_attr( implode( ' ', $p['categorias'] ) ) . '">' . "\n"
		. '<div class="pf-shot" role="img" aria-label="' . esc_attr( $alt ) . '">' . "\n"
		. '<div class="pf-shot__bar" aria-hidden="true"><span class="pf-shot__dot"></span><span class="pf-shot__dot"></span><span class="pf-shot__dot"></span><span class="pf-shot__url">' . esc_html( $p['dominio'] ) . '</span></div>' . "\n"
		. $midia . "\n"
		. '</div>' . "\n"
		. '<div class="pf-card__info">' . "\n"
		. '<p class="pf-meta"><span class="pf-meta__lead">' . esc_html( sprintf( '%02d', $n ) ) . '</span><span aria-hidden="true">·</span><span>' . esc_html( $p['dominio'] ) . '</span></p>' . "\n"
		. '<h3 class="pf-card__name">' . esc_html( $p['nome'] ) . '</h3>' . "\n"
		. '</div>' . "\n"
		. $acao . "\n"
		. '</article>';
}

/* --------------------------------------------------------------------------
   Menus — sem <li> no header (só <a>, como no design); com <li> no rodapé
   -------------------------------------------------------------------------- */

/** Itens de um menu: [rótulo, url, atual?]. Sem menu na posição: os links do design ($reserva). */
function artemis_pf_menu_itens( $local, array $reserva ) {
	$locais = get_nav_menu_locations();
	if ( empty( $locais[ $local ] ) ) {
		return $reserva;
	}
	$itens = wp_get_nav_menu_items( $locais[ $local ] );
	if ( ! $itens ) {
		return $reserva;
	}
	_wp_menu_item_classes_by_context( $itens ); // marca current-menu-item como o wp_nav_menu() faria
	$out = array();
	foreach ( $itens as $item ) {
		if ( (int) $item->menu_item_parent ) {
			continue; // o design não tem submenus
		}
		$classes = (array) $item->classes;
		$out[]   = array( $item->title, $item->url, in_array( 'current-menu-item', $classes, true ) || in_array( 'current_page_item', $classes, true ) );
	}
	return $out;
}

/** Links do design para o menu principal (reserva enquanto o menu "Portfólio — menu principal" não existe). */
function artemis_pf_menu_principal_reserva() {
	return array(
		array( 'Início', 'https://studioartemis.co/', false ),
		array( 'Serviços', 'https://studioartemis.co/servicos', false ),
		array( 'Estudos de impacto', 'https://studioartemis.co/#estudos', false ),
		array( 'Portfólio', 'https://studioartemis.co/portfolio-artemis/', true ),
		array( 'Blog', 'https://studioartemis.co/blog', false ),
		array( 'Sobre', 'https://studioartemis.co/sobre', false ),
		array( 'MktOps', 'https://studioartemis.co/mktops', false ),
	);
}
