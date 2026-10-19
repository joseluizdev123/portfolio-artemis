<?php
/**
 * CPT art_projeto — os projetos do portfólio (cartões da grade + o projeto em destaque).
 * Taxonomia art_projeto_cat — as abas do filtro (Site, Plataforma, Onepage, Blog).
 *
 * Projeto: título (nome) · imagem destacada (captura do site, 16:10) · Ordem (menu_order) · categorias ·
 *          caixa "Dados do projeto": domínio exibido, link, texto do botão; "Em destaque" + campos do destaque.
 * Categoria: nome (texto da aba) · plural (rótulo acima da grade quando a aba está marcada) · ordem da aba.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'art_projeto', array(
		'labels'       => array(
			'name'                  => __( 'Projetos', 'artemis' ),
			'singular_name'         => __( 'Projeto', 'artemis' ),
			'menu_name'             => __( 'Portfólio', 'artemis' ),
			'all_items'             => __( 'Projetos', 'artemis' ),
			'add_new'               => __( 'Adicionar projeto', 'artemis' ),
			'add_new_item'          => __( 'Adicionar projeto', 'artemis' ),
			'edit_item'             => __( 'Editar projeto', 'artemis' ),
			'new_item'              => __( 'Novo projeto', 'artemis' ),
			'search_items'          => __( 'Buscar projetos', 'artemis' ),
			'not_found'             => __( 'Nenhum projeto encontrado', 'artemis' ),
			'not_found_in_trash'    => __( 'Nenhum projeto na lixeira', 'artemis' ),
			'featured_image'        => __( 'Captura do site', 'artemis' ),
			'set_featured_image'    => __( 'Definir captura', 'artemis' ),
			'remove_featured_image' => __( 'Remover captura', 'artemis' ),
			'use_featured_image'    => __( 'Usar como captura', 'artemis' ),
		),
		'public'       => false,
		'show_ui'      => true,
		'show_in_rest' => true,
		'menu_icon'    => 'dashicons-portfolio',
		'supports'     => array( 'title', 'thumbnail', 'page-attributes', 'custom-fields' ), // custom-fields: metas no REST
	) );

	register_taxonomy( 'art_projeto_cat', 'art_projeto', array(
		'labels'            => array(
			'name'          => __( 'Categorias', 'artemis' ),
			'singular_name' => __( 'Categoria', 'artemis' ),
			'menu_name'     => __( 'Categorias (abas)', 'artemis' ),
			'add_new_item'  => __( 'Adicionar categoria', 'artemis' ),
			'edit_item'     => __( 'Editar categoria', 'artemis' ),
			'search_items'  => __( 'Buscar categorias', 'artemis' ),
		),
		'public'            => false,
		'show_ui'           => true,
		'show_in_rest'      => true,
		'show_admin_column' => true,
		'hierarchical'      => true, // caixas de seleção no projeto, como "Categorias" dos posts
		'rewrite'           => false,
	) );

	foreach ( artemis_pf_projeto_campos() as $key => $c ) {
		register_post_meta( 'art_projeto', $key, array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => function ( $valor ) use ( $c ) {
				return artemis_pf_limpa( $valor, $c[1] );
			},
			'auth_callback'     => function ( $permitido, $meta_key, $post_id ) {
				return current_user_can( 'edit_post', $post_id );
			},
		) );
	}
	foreach ( array( '_pf_plural' => 'string', '_pf_ordem' => 'integer' ) as $key => $type ) {
		register_term_meta( 'art_projeto_cat', $key, array(
			'type'              => $type,
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => 'string' === $type ? 'sanitize_text_field' : 'intval',
			'auth_callback' => function () {
				return current_user_can( 'manage_categories' );
			},
		) );
	}
} );

/** Campos do projeto: chave meta => [rótulo, tipo, dica, grupo (geral|destaque)]. */
function artemis_pf_projeto_campos() {
	$campos = array(
		'_pf_dominio'      => array( __( 'Endereço exibido no cartão', 'artemis' ), 'text', __( 'Ex.: arvinc.com.br — ou "Ambiente de teste", "Protótipo no Figma · web e mobile"', 'artemis' ), 'geral' ),
		'_pf_url'          => array( __( 'Link do projeto', 'artemis' ), 'url', __( 'Vazio = cartão sem link (mostra o texto "sem link" abaixo)', 'artemis' ), 'geral' ),
		'_pf_cta'          => array( __( 'Texto do link', 'artemis' ), 'text', __( 'Padrão: Ver site no ar', 'artemis' ), 'geral' ),
		'_pf_cta_sem_link' => array( __( 'Texto quando não há link', 'artemis' ), 'text', __( 'Padrão: Protótipo em breve', 'artemis' ), 'geral' ),
		'_pf_destaque'     => array( __( 'Em destaque', 'artemis' ), 'checkbox', __( 'Mostra este projeto no bloco grande abaixo do filtro (e tira da grade). Vale o primeiro marcado pela ordem.', 'artemis' ), 'destaque' ),
		'_pf_selo'         => array( __( 'Selo', 'artemis' ), 'text', __( 'Padrão: Em destaque', 'artemis' ), 'destaque' ),
		'_pf_formato'      => array( __( 'Formato (antes do endereço)', 'artemis' ), 'text', __( 'Ex.: Site de evento', 'artemis' ), 'destaque' ),
		'_pf_descricao'    => array( __( 'Descrição', 'artemis' ), 'textarea', '', 'destaque' ),
	);
	for ( $n = 1; $n <= 3; $n++ ) {
		/* translators: %d: número do item */
		$campos[ '_pf_fato_' . $n . '_rotulo' ] = array( sprintf( __( 'Item %d — rótulo', 'artemis' ), $n ), 'text', '', 'destaque' );
		/* translators: %d: número do item */
		$campos[ '_pf_fato_' . $n . '_valor' ] = array( sprintf( __( 'Item %d — valor', 'artemis' ), $n ), 'text', '', 'destaque' );
	}
	$campos['_pf_botao'] = array( __( 'Texto do botão', 'artemis' ), 'text', __( 'Padrão: Ver site no ar', 'artemis' ), 'destaque' );
	return $campos;
}

add_action( 'add_meta_boxes_art_projeto', function () {
	add_meta_box( 'artemis_pf_projeto', __( 'Dados do projeto', 'artemis' ), 'artemis_pf_caixa_projeto', 'art_projeto', 'normal', 'high' );
} );

function artemis_pf_caixa_projeto( $post ) {
	wp_nonce_field( 'artemis_pf_projeto', 'artemis_pf_projeto_nonce' );
	$grupos = array(
		'geral'    => '',
		'destaque' => __( 'Projeto em destaque (bloco grande abaixo do filtro)', 'artemis' ),
	);
	foreach ( $grupos as $grupo => $titulo ) {
		if ( $titulo ) {
			echo '<h3 style="margin:24px 0 0">' . esc_html( $titulo ) . '</h3>';
		}
		echo '<table class="form-table" role="presentation"><tbody>';
		foreach ( artemis_pf_projeto_campos() as $key => $c ) {
			if ( $c[3] !== $grupo ) {
				continue;
			}
			list( $rotulo, $tipo, $dica ) = $c;
			$valor = (string) get_post_meta( $post->ID, $key, true );
			$id    = 'artemis' . $key;
			echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $rotulo ) . '</label></th><td>';
			if ( 'checkbox' === $tipo ) {
				printf( '<input type="hidden" name="%1$s" value="0"><label><input type="checkbox" id="%2$s" name="%1$s" value="1"%3$s> %4$s</label>', esc_attr( ltrim( $key, '_' ) ), esc_attr( $id ), checked( '1', $valor, false ), esc_html__( 'Sim', 'artemis' ) );
			} elseif ( 'textarea' === $tipo ) {
				printf( '<textarea class="large-text" rows="3" id="%1$s" name="%2$s">%3$s</textarea>', esc_attr( $id ), esc_attr( ltrim( $key, '_' ) ), esc_textarea( $valor ) );
			} else {
				printf( '<input type="%1$s" class="large-text" id="%2$s" name="%3$s" value="%4$s">', 'url' === $tipo ? 'url' : 'text', esc_attr( $id ), esc_attr( ltrim( $key, '_' ) ), esc_attr( $valor ) );
			}
			if ( $dica ) {
				echo '<p class="description">' . esc_html( $dica ) . '</p>';
			}
			echo '</td></tr>';
		}
		echo '</tbody></table>';
	}
	echo '<p class="description">' . esc_html__( 'Captura: use a "Imagem destacada" (proporção 16:10, a partir de 960 × 540). Categorias: caixa "Categorias (abas)". Ordem na grade: campo "Ordem" em "Atributos".', 'artemis' ) . '</p>';
}

add_action( 'save_post_art_projeto', function ( $post_id ) {
	if ( ! isset( $_POST['artemis_pf_projeto_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['artemis_pf_projeto_nonce'] ), 'artemis_pf_projeto' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( artemis_pf_projeto_campos() as $key => $c ) {
		$nome = ltrim( $key, '_' );
		if ( ! isset( $_POST[ $nome ] ) ) {
			continue;
		}
		$valor = artemis_pf_limpa( wp_unslash( $_POST[ $nome ] ), $c[1] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- artemis_pf_limpa()
		if ( 'checkbox' === $c[1] ) {
			$valor = '1' === $valor ? '1' : '';
		}
		if ( '' === $valor ) {
			delete_post_meta( $post_id, $key );
		} else {
			update_post_meta( $post_id, $key, wp_slash( $valor ) );
		}
	}
} );

/* Listagem de projetos: ordem, captura e destaque; ordenada pelo campo "Ordem". */
add_filter( 'manage_art_projeto_posts_columns', function ( $cols ) {
	$novas = array();
	foreach ( $cols as $k => $v ) {
		if ( 'title' === $k ) {
			$novas['pf_captura'] = __( 'Captura', 'artemis' );
		}
		$novas[ $k ] = $v;
		if ( 'title' === $k ) {
			$novas['pf_ordem']    = __( 'Ordem', 'artemis' );
			$novas['pf_destaque'] = __( 'Destaque', 'artemis' );
		}
	}
	return $novas;
} );

add_action( 'manage_art_projeto_posts_custom_column', function ( $col, $post_id ) {
	if ( 'pf_captura' === $col ) {
		echo get_the_post_thumbnail( $post_id, array( 80, 50 ), array( 'style' => 'width:80px;height:50px;object-fit:cover;object-position:top' ) ); // phpcs:ignore WordPress.Security.EscapeOutput
	} elseif ( 'pf_ordem' === $col ) {
		echo (int) get_post_field( 'menu_order', $post_id );
	} elseif ( 'pf_destaque' === $col ) {
		echo '1' === get_post_meta( $post_id, '_pf_destaque', true ) ? '★' : '—';
	}
}, 10, 2 );

add_action( 'pre_get_posts', function ( $q ) {
	if ( is_admin() && $q->is_main_query() && 'art_projeto' === $q->get( 'post_type' ) && ! $q->get( 'orderby' ) ) {
		$q->set( 'orderby', array( 'menu_order' => 'ASC', 'date' => 'ASC' ) );
	}
} );

/* Categoria: campos "Plural" e "Ordem da aba" (adicionar e editar). */
add_action( 'art_projeto_cat_add_form_fields', function () {
	echo '<div class="form-field"><label for="pf_plural">' . esc_html__( 'Plural', 'artemis' ) . '</label><input type="text" id="pf_plural" name="pf_plural"><p>' . esc_html__( 'Rótulo acima da grade quando esta aba está marcada (ex.: Sites).', 'artemis' ) . '</p></div>';
	echo '<div class="form-field"><label for="pf_ordem">' . esc_html__( 'Ordem da aba', 'artemis' ) . '</label><input type="number" id="pf_ordem" name="pf_ordem" value="0"></div>';
	wp_nonce_field( 'artemis_pf_cat', 'artemis_pf_cat_nonce' );
} );

add_action( 'art_projeto_cat_edit_form_fields', function ( $term ) {
	wp_nonce_field( 'artemis_pf_cat', 'artemis_pf_cat_nonce' );
	printf(
		'<tr class="form-field"><th scope="row"><label for="pf_plural">%s</label></th><td><input type="text" id="pf_plural" name="pf_plural" value="%s"><p class="description">%s</p></td></tr>',
		esc_html__( 'Plural', 'artemis' ),
		esc_attr( get_term_meta( $term->term_id, '_pf_plural', true ) ),
		esc_html__( 'Rótulo acima da grade quando esta aba está marcada (ex.: Sites).', 'artemis' )
	);
	printf(
		'<tr class="form-field"><th scope="row"><label for="pf_ordem">%s</label></th><td><input type="number" id="pf_ordem" name="pf_ordem" value="%d"></td></tr>',
		esc_html__( 'Ordem da aba', 'artemis' ),
		(int) get_term_meta( $term->term_id, '_pf_ordem', true )
	);
} );

$artemis_pf_salva_cat = function ( $term_id ) {
	if ( ! isset( $_POST['artemis_pf_cat_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['artemis_pf_cat_nonce'] ), 'artemis_pf_cat' ) || ! current_user_can( 'manage_categories' ) ) {
		return;
	}
	if ( isset( $_POST['pf_plural'] ) ) {
		update_term_meta( $term_id, '_pf_plural', wp_slash( sanitize_text_field( wp_unslash( $_POST['pf_plural'] ) ) ) );
	}
	if ( isset( $_POST['pf_ordem'] ) ) {
		update_term_meta( $term_id, '_pf_ordem', (int) $_POST['pf_ordem'] );
	}
};
add_action( 'created_art_projeto_cat', $artemis_pf_salva_cat );
add_action( 'edited_art_projeto_cat', $artemis_pf_salva_cat );
