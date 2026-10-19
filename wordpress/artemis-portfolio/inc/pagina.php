<?php
/**
 * Textos da página Portfólio — editáveis na própria página (Páginas → Portfólio), uma caixa por seção.
 *
 * Cada campo é um meta da página: "_" + chave (ex.: _pf_hero_titulo). Vazio = volta ao texto padrão (o do design).
 * {entre chaves} nos títulos = trecho em cinza, como no tema oficial.
 * Os números (total de projetos, de formatos) são calculados — não há campo para eles.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Campos por seção: id da caixa => [título da caixa, [chave => [rótulo, tipo (text|textarea|url|checkbox), padrão]]].
 * Padrões = texto do design (src/partials/portfolio-*.html).
 */
function artemis_pf_campos() {
	return array(
		'hero'    => array(
			__( 'Portfólio — 1. Topo (hero)', 'artemis' ),
			array(
				'pf_hero_eyebrow' => array( __( 'Chamada acima do título', 'artemis' ), 'text', 'Portfólio' ),
				'pf_hero_titulo'  => array( __( 'Título — coloque {entre chaves} o trecho em cinza', 'artemis' ), 'textarea', 'Sites e plataformas que o Studio Artemis {desenhou e colocou no ar}' ),
				'pf_hero_lead'    => array( __( 'Texto de apoio', 'artemis' ), 'textarea', 'Sites institucionais, plataformas, onepages e blogs feitos para empresas implementarem estratégias de marketing e vendas. Cada projeto abre a versão publicada.' ),
				'pf_hero_dica'    => array( __( 'Dica no canto da caixa', 'artemis' ), 'text', 'Passe o cursor' ),
			),
		),
		'filtro'  => array(
			__( 'Portfólio — 2. Filtro', 'artemis' ),
			array(
				'pf_filtro_contagem' => array( __( 'Depois do número de projetos (ex.: 23 projetos …)', 'artemis' ), 'text', 'no portfólio' ),
				'pf_filtro_dica'     => array( __( 'Texto à direita da contagem', 'artemis' ), 'text', 'Filtre por categoria' ),
				'pf_filtro_todos'    => array( __( 'Aba que mostra todos os projetos', 'artemis' ), 'text', 'Todos' ),
			),
		),
		'lista'   => array(
			__( 'Portfólio — 4. Todos os projetos', 'artemis' ),
			array(
				'pf_lista_eyebrow' => array( __( 'Chamada acima do título', 'artemis' ), 'text', 'Todos os projetos' ),
				'pf_lista_titulo'  => array( __( 'Título — {entre chaves} o trecho em cinza', 'artemis' ), 'text', 'Do site institucional {à plataforma}' ),
				'pf_lista_nota'    => array( __( 'Texto à direita do título', 'artemis' ), 'textarea', 'Cada cartão leva ao projeto publicado. Os que ainda estão em ambiente de teste ou protótipo estão indicados.' ),
			),
		),
		'chamada' => array(
			__( 'Portfólio — 4b. Cartão "Próximo projeto" (fim da grade)', 'artemis' ),
			array(
				'pf_chamada_eyebrow'      => array( __( 'Chamada acima do título', 'artemis' ), 'text', 'Próximo projeto' ),
				'pf_chamada_titulo'       => array( __( 'Título — {entre chaves} o trecho em cinza', 'artemis' ), 'textarea', 'O próximo site do portfólio {pode ser o seu}' ),
				'pf_chamada_texto'        => array( __( 'Texto', 'artemis' ), 'textarea', 'Site institucional, plataforma, onepage ou blog. Conte o que você precisa e montamos o caminho.' ),
				'pf_chamada_seta_url'     => array( __( 'Link do botão redondo (seta)', 'artemis' ), 'url', 'https://studioartemis.co/contato' ),
				'pf_chamada_seta_rotulo'  => array( __( 'Nome do botão redondo para leitores de tela', 'artemis' ), 'text', 'Comece um projeto' ),
				'pf_chamada_botao1_texto' => array( __( 'Botão principal — texto', 'artemis' ), 'text', 'Comece um projeto' ),
				'pf_chamada_botao1_url'   => array( __( 'Botão principal — link', 'artemis' ), 'url', 'https://studioartemis.co/contato' ),
				'pf_chamada_botao2_texto' => array( __( 'Botão secundário — texto', 'artemis' ), 'text', 'Ver serviços' ),
				'pf_chamada_botao2_url'   => array( __( 'Botão secundário — link', 'artemis' ), 'url', 'https://studioartemis.co/servicos' ),
				'pf_stat1_rotulo'         => array( __( 'Número 1 — rótulo (o valor é o total de projetos publicados)', 'artemis' ), 'text', 'Projetos' ),
				'pf_stat2_rotulo'         => array( __( 'Número 2 — rótulo (o valor é o número de categorias)', 'artemis' ), 'text', 'Formatos' ),
				'pf_stat3_rotulo'         => array( __( 'Número 3 — rótulo', 'artemis' ), 'text', 'Primeira resposta' ),
				'pf_stat3_valor'          => array( __( 'Número 3 — valor', 'artemis' ), 'text', '1 dia' ),
				'pf_stat3_sufixo'         => array( __( 'Número 3 — complemento menor, em cinza', 'artemis' ), 'text', 'útil' ),
			),
		),
		'cta'     => array(
			__( 'Portfólio — 5. Chamada final', 'artemis' ),
			array(
				'pf_cta_status1'        => array( __( 'Barra de status — texto 1', 'artemis' ), 'text', 'System: Artemis portfolio' ),
				'pf_cta_status2'        => array( __( 'Barra de status — texto 2', 'artemis' ), 'text', '[ Status: online ]' ),
				'pf_cta_status3_rotulo' => array( __( 'Barra de status — texto 3, antes do total (fica "[ Projetos: 23 ]")', 'artemis' ), 'text', 'Projetos' ),
				'pf_cta_nota'           => array( __( 'Nota no canto direito', 'artemis' ), 'textarea', 'Resposta em até 1 dia útil. Atendimento remoto em todo o Brasil.' ),
				'pf_cta_titulo'         => array( __( 'Título', 'artemis' ), 'text', 'Comece um projeto' ),
				'pf_cta_texto'          => array( __( 'Texto', 'artemis' ), 'textarea', 'Conte o objetivo, o prazo e o que já existe hoje. Voltamos com escopo, etapas e a primeira proposta de estrutura do site.' ),
				'pf_cta_botao_texto'    => array( __( 'Botão — texto', 'artemis' ), 'text', 'Comece um projeto' ),
				'pf_cta_botao_url'      => array( __( 'Botão — link', 'artemis' ), 'url', 'https://studioartemis.co/contato' ),
			),
		),
		'seo'     => array(
			__( 'Portfólio — SEO', 'artemis' ),
			array(
				'pf_seo_titulo'    => array( __( 'Título da aba do navegador / Google', 'artemis' ), 'text', 'Portfólio — Sites e plataformas do Studio Artemis' ),
				'pf_seo_descricao' => array( __( 'Descrição para o Google', 'artemis' ), 'textarea', 'Sites institucionais, plataformas, onepages e blogs feitos para empresas implementarem estratégias de marketing e vendas. Cada projeto abre a versão publicada.' ),
				'pf_seo_noindex'   => array( __( 'Esconder dos buscadores (prévia)', 'artemis' ), 'checkbox', '1' ),
			),
		),
	);
}

/** Todos os campos numa lista só: chave => [rotulo, tipo, padrao]. */
function artemis_pf_campos_planos() {
	static $planos = null;
	if ( null === $planos ) {
		$planos = array();
		foreach ( artemis_pf_campos() as $secao ) {
			foreach ( $secao[1] as $key => $c ) {
				$planos[ $key ] = array( 'rotulo' => $c[0], 'tipo' => $c[1], 'padrao' => $c[2] );
			}
		}
	}
	return $planos;
}

/** A página em edição usa o template Portfólio? */
function artemis_pf_e_pagina_portfolio( $post ) {
	$post = get_post( $post );
	return $post && 'page' === $post->post_type && 'templates/portfolio.php' === get_page_template_slug( $post );
}

/* Metas registrados (REST: o editor e os testes leem/gravam por /wp/v2/pages/<id>). */
add_action( 'init', function () {
	foreach ( artemis_pf_campos_planos() as $key => $c ) {
		register_post_meta( 'page', '_' . $key, array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => function ( $valor ) use ( $c ) {
				return artemis_pf_limpa( $valor, $c['tipo'] );
			},
			'auth_callback'     => function ( $permitido, $meta_key, $post_id ) {
				return current_user_can( 'edit_post', $post_id );
			},
		) );
	}
} );

/** Sanitização por tipo de campo. */
function artemis_pf_limpa( $valor, $tipo ) {
	$valor = (string) $valor;
	switch ( $tipo ) {
		case 'textarea':
			return sanitize_textarea_field( $valor );
		case 'url':
			return esc_url_raw( $valor );
		case 'checkbox':
			return '' === $valor || '0' === $valor ? '0' : '1';
		default:
			return sanitize_text_field( $valor );
	}
}

/*
 * Na página Portfólio o conteúdo vem só das caixas abaixo: editor clássico (as caixas ficam visíveis e organizadas)
 * e sem a área de texto principal, que a página não usa.
 */
add_filter( 'use_block_editor_for_post', function ( $usar, $post ) {
	return artemis_pf_e_pagina_portfolio( $post ) ? false : $usar;
}, 10, 2 );

add_action( 'add_meta_boxes_page', function ( $post ) {
	if ( ! artemis_pf_e_pagina_portfolio( $post ) ) {
		return;
	}
	remove_post_type_support( 'page', 'editor' );
	add_meta_box( 'artemis_pf_ajuda', __( 'Como editar esta página', 'artemis' ), 'artemis_pf_caixa_ajuda', 'page', 'normal', 'high' );
	foreach ( artemis_pf_campos() as $id => $secao ) {
		add_meta_box( 'artemis_pf_' . $id, $secao[0], 'artemis_pf_caixa', 'page', 'normal', 'default', array( 'secao' => $id ) );
	}
} );

function artemis_pf_caixa_ajuda() {
	$link_projetos = admin_url( 'edit.php?post_type=art_projeto' );
	$link_cats     = admin_url( 'edit-tags.php?taxonomy=art_projeto_cat&post_type=art_projeto' );
	$link_custom   = admin_url( 'customize.php?autofocus[section]=artemis_pf_header' );
	echo '<p>' . esc_html__( 'Cada caixa abaixo é uma seção da página. Campo vazio volta ao texto original do design. Nos títulos, o trecho {entre chaves} fica em cinza.', 'artemis' ) . '</p>';
	echo '<ul style="list-style:disc;padding-left:20px">';
	printf( '<li><a href="%s">%s</a> — %s</li>', esc_url( $link_projetos ), esc_html__( 'Projetos', 'artemis' ), esc_html__( 'cartões da grade e o projeto em destaque (marque "Em destaque" no projeto). A ordem segue o campo "Ordem".', 'artemis' ) );
	printf( '<li><a href="%s">%s</a> — %s</li>', esc_url( $link_cats ), esc_html__( 'Categorias', 'artemis' ), esc_html__( 'as abas do filtro (nome, plural e ordem).', 'artemis' ) );
	printf( '<li><a href="%s">%s</a> — %s</li>', esc_url( $link_custom ), esc_html__( 'Personalizar → Portfólio: header e rodapé', 'artemis' ), esc_html__( 'selo, botão do topo, rodapé, contatos e redes. Os links do menu e do rodapé ficam em Aparência → Menus.', 'artemis' ) );
	echo '</ul>';
	/* translators: %d: total de projetos publicados */
	echo '<p class="description">' . esc_html( sprintf( __( 'Os números da página são calculados: hoje há %d projetos publicados.', 'artemis' ), artemis_pf_contar_publicados() ) ) . '</p>';
}

function artemis_pf_contar_publicados() {
	$c = wp_count_posts( 'art_projeto' );
	return isset( $c->publish ) ? (int) $c->publish : 0;
}

/** Uma caixa de seção: um campo por linha, com o padrão como dica. */
function artemis_pf_caixa( $post, $box ) {
	$secao = artemis_pf_campos()[ $box['args']['secao'] ];
	wp_nonce_field( 'artemis_pf_pagina', 'artemis_pf_nonce' );
	echo '<table class="form-table" role="presentation"><tbody>';
	foreach ( $secao[1] as $key => $c ) {
		list( $rotulo, $tipo, $padrao ) = $c;
		$valor = get_post_meta( $post->ID, '_' . $key, true );
		$id    = 'artemis-' . $key;
		echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $rotulo ) . '</label></th><td>';
		if ( 'checkbox' === $tipo ) {
			$marcado = '' === (string) $valor ? '1' === $padrao : '1' === (string) $valor;
			printf( '<input type="hidden" name="%1$s" value="0"><label><input type="checkbox" id="%2$s" name="%1$s" value="1"%3$s> %4$s</label>', esc_attr( $key ), esc_attr( $id ), checked( $marcado, true, false ), esc_html__( 'Sim', 'artemis' ) );
		} elseif ( 'textarea' === $tipo ) {
			printf( '<textarea class="large-text" rows="3" id="%1$s" name="%2$s" placeholder="%3$s">%4$s</textarea>', esc_attr( $id ), esc_attr( $key ), esc_attr( $padrao ), esc_textarea( $valor ) );
		} else {
			printf( '<input type="%1$s" class="large-text" id="%2$s" name="%3$s" value="%4$s" placeholder="%5$s">', 'url' === $tipo ? 'url' : 'text', esc_attr( $id ), esc_attr( $key ), esc_attr( $valor ), esc_attr( $padrao ) );
		}
		if ( 'checkbox' !== $tipo ) {
			/* translators: %s: texto padrão do design */
			echo '<p class="description">' . esc_html( sprintf( __( 'Padrão: %s', 'artemis' ), $padrao ) ) . '</p>';
		}
		echo '</td></tr>';
	}
	echo '</tbody></table>';
}

add_action( 'save_post_page', function ( $post_id ) {
	if ( ! isset( $_POST['artemis_pf_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['artemis_pf_nonce'] ), 'artemis_pf_pagina' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( artemis_pf_campos_planos() as $key => $c ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			continue;
		}
		$valor = artemis_pf_limpa( wp_unslash( $_POST[ $key ] ), $c['tipo'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- artemis_pf_limpa()
		// igual ao padrão (ou vazio) = não guarda: a página segue o design e acompanha mudanças futuras do padrão
		if ( '' === $valor || $valor === $c['padrao'] ) {
			delete_post_meta( $post_id, '_' . $key );
		} else {
			update_post_meta( $post_id, '_' . $key, $valor );
		}
	}
} );

/* <title>, descrição e robots da página Portfólio. */
add_filter( 'pre_get_document_title', function ( $titulo ) {
	return is_page() && artemis_pf_e_pagina_portfolio( get_queried_object() ) ? artemis_pf_txt( 'pf_seo_titulo' ) : $titulo;
} );

add_action( 'wp_head', function () {
	if ( is_page() && artemis_pf_e_pagina_portfolio( get_queried_object() ) ) {
		printf( '<meta name="description" content="%s">' . "\n", esc_attr( artemis_pf_txt( 'pf_seo_descricao' ) ) );
	}
}, 2 );

add_filter( 'wp_robots', function ( $robots ) {
	if ( is_page() && artemis_pf_e_pagina_portfolio( get_queried_object() ) && '1' === artemis_pf_txt( 'pf_seo_noindex' ) ) {
		$robots['noindex']  = true;
		$robots['nofollow'] = true;
	}
	return $robots;
} );
