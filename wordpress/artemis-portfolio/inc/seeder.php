<?php
/**
 * Seeder one-click: Aparência → Portfólio: popular conteúdo.
 *
 * Importa data/projetos.json (cópia de src/projetos.json feita pelo tools/build.py): as categorias (abas do filtro),
 * o projeto em destaque, os projetos da grade e as capturas (para a Mídia). Cria a página Portfólio, os 4 menus do
 * design e acerta os links permanentes. Tudo sai do JSON: categoria ou projeto novo lá entra no próximo clique.
 *
 * Idempotente: procura cada item antes de criar e nunca sobrescreve o que já existe (edições feitas no painel ficam).
 * Também pode ser chamado direto do PHP/CLI: artemis_pf_seed( $front ) devolve o log.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', function () {
	add_theme_page(
		__( 'Portfólio: popular conteúdo', 'artemis' ),
		__( 'Portfólio: popular conteúdo', 'artemis' ),
		'manage_options',
		'artemis-pf-seeder',
		'artemis_pf_seeder_page'
	);
} );

/** Tela do seeder (Aparência → Portfólio: popular conteúdo). */
function artemis_pf_seeder_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Você não tem permissão para acessar esta página.', 'artemis' ) );
	}

	$log   = array();
	$front = true;
	if ( isset( $_POST['artemis_pf_seed'] ) ) {
		check_admin_referer( 'artemis_pf_seed' );
		$front = ! empty( $_POST['artemis_pf_front'] );
		$log   = artemis_pf_seed( $front );
	}

	echo '<div class="wrap"><h1>' . esc_html__( 'Portfólio: popular conteúdo', 'artemis' ) . '</h1>';
	echo '<p>' . esc_html__( 'Importa as categorias, o projeto em destaque, os projetos da grade e as capturas (para a Mídia), cria a página Portfólio e os menus do header e do rodapé.', 'artemis' ) . '</p>';
	echo '<p>' . esc_html__( 'Pode rodar mais de uma vez: o que já existe é mantido e nada do que foi editado no painel é sobrescrito.', 'artemis' ) . '</p>';
	echo '<form method="post">';
	wp_nonce_field( 'artemis_pf_seed' );
	echo '<p><label><input type="checkbox" name="artemis_pf_front" value="1"' . checked( $front, true, false ) . '> ';
	echo esc_html__( 'Definir a página Portfólio como página inicial', 'artemis' ) . '</label></p>';
	submit_button( __( 'Popular agora', 'artemis' ), 'primary', 'artemis_pf_seed' );
	echo '</form>';

	if ( $log ) {
		echo '<h2>' . esc_html__( 'Resultado', 'artemis' ) . '</h2>';
		echo '<ul style="list-style:disc;padding-left:20px">';
		foreach ( $log as $line ) {
			echo '<li>' . esc_html( $line ) . '</li>';
		}
		echo '</ul>';

		$page = get_page_by_path( 'portfolio-artemis' );
		if ( $page && 'trash' !== $page->post_status ) {
			echo '<p><a class="button" href="' . esc_url( get_permalink( $page ) ) . '">' . esc_html__( 'Ver a página', 'artemis' ) . '</a> ';
			echo '<a class="button" href="' . esc_url( get_edit_post_link( $page->ID, 'url' ) ) . '">' . esc_html__( 'Editar os textos da página', 'artemis' ) . '</a> ';
			echo '<a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=art_projeto' ) ) . '">' . esc_html__( 'Ver os projetos', 'artemis' ) . '</a></p>';
		}
	}
	echo '</div>';
}

/** Pasta do tema (sem barra no fim). */
function artemis_pf_seed_dir() {
	return defined( 'ARTEMIS_PF_DIR' ) ? ARTEMIS_PF_DIR : get_template_directory();
}

/**
 * Lê data/projetos.json.
 *
 * @return array|WP_Error
 */
function artemis_pf_seed_data() {
	$file = artemis_pf_seed_dir() . '/data/projetos.json';
	if ( ! is_readable( $file ) ) {
		/* translators: %s: caminho do arquivo dentro do tema. */
		return new WP_Error( 'artemis_pf_no_data', sprintf( __( 'Arquivo de dados não encontrado: %s', 'artemis' ), 'data/projetos.json' ) );
	}
	$raw = (string) file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$raw = preg_replace( '/^\xEF\xBB\xBF/', '', $raw ); // BOM.
	$data = json_decode( $raw, true );
	if ( ! is_array( $data ) ) {
		/* translators: %s: mensagem de erro do json_decode. */
		return new WP_Error( 'artemis_pf_bad_data', sprintf( __( 'data/projetos.json inválido: %s', 'artemis' ), json_last_error_msg() ) );
	}
	return $data;
}

/**
 * Executa o seeder.
 *
 * @param bool $front Define a página Portfólio como página inicial.
 * @return string[] Log em português.
 */
function artemis_pf_seed( $front = true ) {
	$log = array();

	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 300 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	}

	// O conteúdo vem do próprio tema: grava como um administrador gravaria ("&" fica "&", não "&amp;"), também quando
	// o seeder roda pelo CLI, sem usuário com unfiltered_html. Os filtros do kses voltam logo depois.
	$kses = (bool) has_filter( 'title_save_pre', 'wp_filter_kses' );
	if ( $kses ) {
		kses_remove_filters();
	}
	try {
		artemis_pf_seed_run( (bool) $front, $log );
	} finally {
		if ( $kses ) {
			kses_init_filters();
		}
	}

	$log[] = __( 'Concluído.', 'artemis' );
	return $log;
}

/** Corpo do seeder (ver artemis_pf_seed()). */
function artemis_pf_seed_run( $front, array &$log ) {
	$data = artemis_pf_seed_data();
	if ( is_wp_error( $data ) ) {
		$log[] = $data->get_error_message();
		$data  = array();
	}

	if ( ! post_type_exists( 'art_projeto' ) || ! taxonomy_exists( 'art_projeto_cat' ) ) {
		$log[] = __( 'O tipo de conteúdo "art_projeto" ou a taxonomia "art_projeto_cat" não está registrado: ative o tema Artemis Portfólio. Projetos e categorias não foram importados.', 'artemis' );
		$data  = array();
	}

	// 1. Categorias (abas do filtro).
	$terms = array();
	if ( ! empty( $data['categorias'] ) && is_array( $data['categorias'] ) ) {
		$terms = artemis_pf_seed_terms( $data['categorias'], $log );
	}

	// 2. Projetos: o destaque (ordem 0) e a grade (ordem 1..N, na ordem do JSON).
	if ( $data ) {
		if ( ! empty( $data['destaque'] ) && is_array( $data['destaque'] ) ) {
			artemis_pf_seed_projeto( $data['destaque'], 0, true, $terms, $log );
		}
		if ( ! empty( $data['projetos'] ) && is_array( $data['projetos'] ) ) {
			$order = 1;
			foreach ( $data['projetos'] as $projeto ) {
				if ( is_array( $projeto ) ) {
					artemis_pf_seed_projeto( $projeto, $order, false, $terms, $log );
				}
				$order++;
			}
		}
	}

	// 3. Página Portfólio (+ página inicial).
	$page_id = artemis_pf_seed_page( $log );
	if ( $front && $page_id ) {
		if ( (int) get_option( 'page_for_posts' ) === $page_id ) {
			update_option( 'page_for_posts', 0 );
		}
		if ( 'page' !== get_option( 'show_on_front' ) || (int) get_option( 'page_on_front' ) !== $page_id ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $page_id );
			$log[] = __( 'Página inicial definida: Portfólio.', 'artemis' );
		} else {
			$log[] = __( 'Já existia: Portfólio como página inicial.', 'artemis' );
		}
	}

	// 4. Menus do design.
	artemis_pf_seed_menus( $page_id, $log );

	// 5. Links permanentes.
	artemis_pf_seed_permalinks( $log );
}

/**
 * Cria os termos de art_projeto_cat (slug, nome, _pf_plural, _pf_ordem = posição 1..N).
 * Termo existente: mantido; só recebe o meta que estiver faltando.
 *
 * @return int[] slug => term_id
 */
function artemis_pf_seed_terms( array $categorias, array &$log ) {
	$ids   = array();
	$ordem = 1;
	foreach ( $categorias as $cat ) {
		if ( ! is_array( $cat ) || empty( $cat['slug'] ) ) {
			continue;
		}
		$slug   = sanitize_title( $cat['slug'] );
		$nome   = isset( $cat['nome'] ) ? (string) $cat['nome'] : $slug;
		$plural = isset( $cat['plural'] ) ? (string) $cat['plural'] : $nome;

		$term = get_term_by( 'slug', $slug, 'art_projeto_cat' );
		if ( $term ) {
			$term_id = (int) $term->term_id;
			/* translators: %s: nome da categoria. */
			$log[] = sprintf( __( 'Já existia: categoria %s', 'artemis' ), $term->name );
			if ( ! metadata_exists( 'term', $term_id, '_pf_plural' ) ) {
				update_term_meta( $term_id, '_pf_plural', wp_slash( $plural ) );
			}
			if ( ! metadata_exists( 'term', $term_id, '_pf_ordem' ) ) {
				update_term_meta( $term_id, '_pf_ordem', $ordem );
			}
		} else {
			$r = wp_insert_term( wp_slash( $nome ), 'art_projeto_cat', array( 'slug' => $slug ) );
			if ( is_wp_error( $r ) ) {
				/* translators: 1: nome da categoria, 2: mensagem de erro. */
				$log[] = sprintf( __( 'Falha ao criar a categoria %1$s: %2$s', 'artemis' ), $nome, $r->get_error_message() );
				$ordem++;
				continue;
			}
			$term_id = (int) $r['term_id'];
			update_term_meta( $term_id, '_pf_plural', wp_slash( $plural ) );
			update_term_meta( $term_id, '_pf_ordem', $ordem );
			/* translators: %s: nome da categoria. */
			$log[] = sprintf( __( 'Categoria criada: %s', 'artemis' ), $nome );
		}
		$ids[ $slug ] = $term_id;
		$ordem++;
	}
	return $ids;
}

/**
 * Procura um projeto já existente: pelo título exato (como foi digitado e como o WordPress o grava, já que o kses
 * transforma "&" em "&amp;" quando o usuário não tem unfiltered_html) ou pela marca _pf_seed_nome (projeto renomeado).
 * Vale qualquer status, inclusive lixeira: um projeto apagado de propósito não volta enquanto estiver lá.
 */
function artemis_pf_seed_find_projeto( $nome ) {
	$status = array( 'publish', 'future', 'draft', 'pending', 'private', 'trash' );
	$base   = array(
		'post_type'              => 'art_projeto',
		'post_status'            => $status,
		'numberposts'            => 1,
		'fields'                 => 'ids',
		'orderby'                => 'ID',
		'order'                  => 'ASC',
		'no_found_rows'          => true,
		'update_post_meta_cache' => false,
		'update_post_term_cache' => false,
	);

	$titles = array( $nome );
	$stored = wp_unslash( sanitize_post_field( 'post_title', wp_slash( $nome ), 0, 'db' ) );
	if ( $stored !== $nome ) {
		$titles[] = $stored;
	}
	foreach ( $titles as $title ) {
		$found = get_posts( array_merge( $base, array( 'title' => $title ) ) );
		if ( $found ) {
			return (int) $found[0];
		}
	}

	$found = get_posts( array_merge( $base, array(
		'meta_key'   => '_pf_seed_nome', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		'meta_value' => $nome, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
	) ) );
	return $found ? (int) $found[0] : 0;
}

/** "#" ou vazio = sem link (''). */
function artemis_pf_seed_url( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url || '#' === $url ) {
		return '';
	}
	return esc_url_raw( $url );
}

/**
 * Cria um projeto (destaque ou grade) se ainda não existir.
 *
 * @param array $p        Item do JSON (nome, dominio, url, cta?, cta_sem_link?, imagem?, categorias[] e, no destaque,
 *                        selo, formato, descricao, fatos[[rotulo, valor] x3], botao).
 * @param int   $order    menu_order.
 * @param bool  $destaque Projeto em destaque.
 * @param int[] $terms    slug => term_id.
 * @return int ID do post (novo ou existente), 0 em caso de falha.
 */
function artemis_pf_seed_projeto( array $p, $order, $destaque, array $terms, array &$log ) {
	$nome = isset( $p['nome'] ) ? trim( (string) $p['nome'] ) : '';
	if ( '' === $nome ) {
		return 0;
	}

	$existing = artemis_pf_seed_find_projeto( $nome );
	if ( $existing ) {
		/* translators: %s: nome do projeto. */
		$log[] = sprintf( __( 'Já existia: projeto %s', 'artemis' ), $nome );
		return $existing;
	}

	$id = wp_insert_post( wp_slash( array(
		'post_type'   => 'art_projeto',
		'post_status' => 'publish',
		'post_title'  => $nome,
		'menu_order'  => (int) $order,
	) ), true );
	if ( is_wp_error( $id ) || ! $id ) {
		/* translators: 1: nome do projeto, 2: mensagem de erro. */
		$log[] = sprintf( __( 'Falha ao criar o projeto %1$s: %2$s', 'artemis' ), $nome, is_wp_error( $id ) ? $id->get_error_message() : '?' );
		return 0;
	}
	$id = (int) $id;

	$meta = array(
		'_pf_seed_nome' => $nome,
		'_pf_dominio'   => isset( $p['dominio'] ) ? (string) $p['dominio'] : '',
		'_pf_url'       => artemis_pf_seed_url( isset( $p['url'] ) ? $p['url'] : '' ),
	);
	if ( ! empty( $p['cta'] ) ) {
		$meta['_pf_cta'] = (string) $p['cta'];
	}
	if ( ! empty( $p['cta_sem_link'] ) ) {
		$meta['_pf_cta_sem_link'] = (string) $p['cta_sem_link'];
	}
	if ( $destaque ) {
		$meta['_pf_destaque'] = '1';
		foreach ( array( 'selo', 'formato', 'descricao', 'botao' ) as $key ) {
			if ( isset( $p[ $key ] ) ) {
				$meta[ '_pf_' . $key ] = (string) $p[ $key ];
			}
		}
		$fatos = ( isset( $p['fatos'] ) && is_array( $p['fatos'] ) ) ? array_values( $p['fatos'] ) : array();
		for ( $n = 1; $n <= 3; $n++ ) {
			$fato = ( isset( $fatos[ $n - 1 ] ) && is_array( $fatos[ $n - 1 ] ) ) ? array_values( $fatos[ $n - 1 ] ) : array();
			$meta[ '_pf_fato_' . $n . '_rotulo' ] = isset( $fato[0] ) ? (string) $fato[0] : '';
			$meta[ '_pf_fato_' . $n . '_valor' ]  = isset( $fato[1] ) ? (string) $fato[1] : '';
		}
	}
	foreach ( $meta as $key => $value ) {
		update_post_meta( $id, $key, wp_slash( $value ) );
	}

	// Categorias.
	$cats = array();
	if ( ! empty( $p['categorias'] ) && is_array( $p['categorias'] ) ) {
		foreach ( $p['categorias'] as $slug ) {
			$slug = sanitize_title( (string) $slug );
			if ( isset( $terms[ $slug ] ) ) {
				$cats[] = (int) $terms[ $slug ];
			} else {
				$term = get_term_by( 'slug', $slug, 'art_projeto_cat' );
				if ( $term ) {
					$cats[] = (int) $term->term_id;
				}
			}
		}
	}
	if ( $cats ) {
		$r = wp_set_object_terms( $id, $cats, 'art_projeto_cat' );
		if ( is_wp_error( $r ) ) {
			/* translators: 1: nome do projeto, 2: mensagem de erro. */
			$log[] = sprintf( __( 'Falha ao definir as categorias de %1$s: %2$s', 'artemis' ), $nome, $r->get_error_message() );
		}
	}

	// Imagem destacada (captura).
	if ( ! empty( $p['imagem'] ) ) {
		$media = artemis_pf_seed_media( (string) $p['imagem'], $nome, $log );
		if ( $media && ! set_post_thumbnail( $id, $media ) ) {
			update_post_meta( $id, '_thumbnail_id', $media );
		}
	}

	/* translators: %s: nome do projeto. */
	$log[] = sprintf( __( 'Projeto criado: %s', 'artemis' ), $nome );
	return $id;
}

/**
 * Importa um arquivo do tema para a Mídia, uma vez só (marca _pf_seed_src = caminho relativo).
 * Funciona sem GD/Imagick: o WordPress grava o original sem tamanhos intermediários.
 *
 * @param string $rel_path Caminho relativo à pasta do tema (ex.: assets/images/projetos/expo-usipa.jpg).
 * @param string $title    Título do anexo (nome do projeto).
 * @return int ID do anexo, 0 em caso de falha.
 */
function artemis_pf_seed_media( $rel_path, $title, array &$log ) {
	$rel_path = ltrim( str_replace( '\\', '/', $rel_path ), '/' );

	$existing = get_posts( array(
		'post_type'              => 'attachment',
		'post_status'            => 'any',
		'meta_key'               => '_pf_seed_src', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		'meta_value'             => $rel_path, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		'numberposts'            => 1,
		'fields'                 => 'ids',
		'no_found_rows'          => true,
		'update_post_term_cache' => false,
	) );
	if ( $existing ) {
		/* translators: %s: caminho da imagem. */
		$log[] = sprintf( __( 'Já existia: imagem %s', 'artemis' ), $rel_path );
		return (int) $existing[0];
	}

	$src = artemis_pf_seed_dir() . '/' . $rel_path;
	if ( false !== strpos( $rel_path, '..' ) || ! is_file( $src ) || ! is_readable( $src ) ) {
		/* translators: %s: caminho da imagem. */
		$log[] = sprintf( __( 'Imagem não encontrada no tema: %s', 'artemis' ), $rel_path );
		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	static $avisou = false;
	if ( ! $avisou && ! wp_image_editor_supports( array( 'mime_type' => 'image/jpeg' ) ) ) {
		$log[] = __( 'Aviso: o servidor não tem editor de imagem (GD ou Imagick). As capturas são importadas no tamanho original, sem tamanhos intermediários.', 'artemis' );
	}
	$avisou = true;

	$tmp = wp_tempnam( basename( $rel_path ) );
	if ( ! $tmp || ! @copy( $src, $tmp ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors
		/* translators: %s: caminho da imagem. */
		$log[] = sprintf( __( 'Falha ao importar a imagem %s: não foi possível criar a cópia temporária.', 'artemis' ), $rel_path );
		if ( $tmp && file_exists( $tmp ) ) {
			wp_delete_file( $tmp );
		}
		return 0;
	}

	$file = array(
		'name'     => basename( $rel_path ),
		'tmp_name' => $tmp,
		'error'    => 0,
		'size'     => filesize( $tmp ),
	);
	try {
		$id = media_handle_sideload( $file, 0, $title, array( 'post_title' => $title ) );
	} catch ( Throwable $e ) {
		$id = new WP_Error( 'artemis_pf_sideload', $e->getMessage() );
	}
	if ( file_exists( $tmp ) ) {
		wp_delete_file( $tmp );
	}
	if ( is_wp_error( $id ) || ! $id ) {
		/* translators: 1: caminho da imagem, 2: mensagem de erro. */
		$log[] = sprintf( __( 'Falha ao importar a imagem %1$s: %2$s', 'artemis' ), $rel_path, is_wp_error( $id ) ? $id->get_error_message() : '?' );
		return 0;
	}
	$id = (int) $id;

	update_post_meta( $id, '_pf_seed_src', wp_slash( $rel_path ) );
	update_post_meta( $id, '_wp_attachment_image_alt', '' );

	/* translators: %s: caminho da imagem. */
	$log[] = sprintf( __( 'Imagem importada: %s', 'artemis' ), $rel_path );
	return $id;
}

/**
 * Página Portfólio (slug portfolio-artemis, template templates/portfolio.php).
 * Os textos ficam nos padrões de inc/pagina.php até alguém editá-los: o seeder não grava meta de texto.
 *
 * @return int ID da página, 0 em caso de falha.
 */
function artemis_pf_seed_page( array &$log ) {
	$template = 'templates/portfolio.php';
	$page     = get_page_by_path( 'portfolio-artemis' );

	if ( $page && 'trash' !== $page->post_status ) {
		$page_id = (int) $page->ID;
		$log[]   = __( 'Já existia: página Portfólio', 'artemis' );
		// Só preenche o template se a página não tiver nenhum (não troca um template escolhido no painel).
		if ( '' === (string) get_post_meta( $page_id, '_wp_page_template', true ) ) {
			update_post_meta( $page_id, '_wp_page_template', $template );
			$log[] = __( 'Template Portfólio aplicado à página.', 'artemis' );
		}
		return $page_id;
	}

	// Sem 'page_template' no insert: o wp_insert_post trocaria por "default" se o tema não estivesse ativo.
	$page_id = wp_insert_post( wp_slash( array(
		'post_type'   => 'page',
		'post_status' => 'publish',
		'post_title'  => 'Portfólio',
		'post_name'   => 'portfolio-artemis',
	) ), true );
	if ( is_wp_error( $page_id ) || ! $page_id ) {
		/* translators: %s: mensagem de erro. */
		$log[] = sprintf( __( 'Falha ao criar a página Portfólio: %s', 'artemis' ), is_wp_error( $page_id ) ? $page_id->get_error_message() : '?' );
		return 0;
	}
	$page_id = (int) $page_id;
	update_post_meta( $page_id, '_wp_page_template', $template );
	$log[] = __( 'Página criada: Portfólio', 'artemis' );
	return $page_id;
}

/** Os 4 menus do design (local => [nome, itens]). Item 'page' = a página Portfólio. */
function artemis_pf_seed_menu_defs() {
	$site = 'https://studioartemis.co';
	return array(
		'pf_principal'      => array(
			'Portfólio — principal',
			array(
				array( 'Início', $site . '/' ),
				array( 'Serviços', $site . '/servicos' ),
				array( 'Estudos de impacto', $site . '/#estudos' ),
				array( 'Portfólio', 'page' ),
				array( 'Blog', $site . '/blog' ),
				array( 'Sobre', $site . '/sobre' ),
				array( 'MktOps', $site . '/mktops' ),
			),
		),
		'pf_rodape_artemis' => array(
			'Portfólio — rodapé Artemis',
			array(
				array( 'Serviços', $site . '/servicos' ),
				array( 'Estudos de impacto', $site . '/#estudos' ),
				array( 'Portfólio', 'page' ),
				array( 'Blog', $site . '/blog' ),
				array( 'Sobre', $site . '/sobre' ),
				array( 'Contato', $site . '/contato' ),
			),
		),
		'pf_rodape_linhas'  => array(
			'Portfólio — rodapé Outras linhas',
			array(
				array( 'Artemis SEO', $site . '/artemis-seo/' ),
				array( 'MktOps', $site . '/mktops/' ),
			),
		),
		'pf_legal'          => array(
			'Portfólio — links legais',
			array(
				array( 'Política de privacidade', $site . '/politica-de-privacidade' ),
				array( 'Termos de uso', $site . '/termos-de-uso' ),
			),
		),
	);
}

/**
 * Cria os menus que faltam e atribui aos locais. Local que já tem menu: mantido.
 * Menu que já existe com o mesmo nome: só é atribuído (os itens dele não mudam).
 */
function artemis_pf_seed_menus( $page_id, array &$log ) {
	$locations = get_nav_menu_locations();
	$changed   = false;

	foreach ( artemis_pf_seed_menu_defs() as $location => $def ) {
		list( $name, $items ) = $def;

		if ( ! empty( $locations[ $location ] ) && wp_get_nav_menu_object( $locations[ $location ] ) ) {
			/* translators: %s: local do menu. */
			$log[] = sprintf( __( 'Já existia: menu no local %s', 'artemis' ), $location );
			continue;
		}

		$menu = wp_get_nav_menu_object( $name );
		if ( $menu ) {
			$menu_id = (int) $menu->term_id;
			/* translators: %s: nome do menu. */
			$log[] = sprintf( __( 'Já existia: menu %s', 'artemis' ), $name );
		} else {
			$menu_id = wp_create_nav_menu( $name );
			if ( is_wp_error( $menu_id ) || ! $menu_id ) {
				/* translators: 1: nome do menu, 2: mensagem de erro. */
				$log[] = sprintf( __( 'Falha ao criar o menu %1$s: %2$s', 'artemis' ), $name, is_wp_error( $menu_id ) ? $menu_id->get_error_message() : '?' );
				continue;
			}
			$menu_id  = (int) $menu_id;
			$position = 1;
			foreach ( $items as $item ) {
				list( $title, $target ) = $item;
				if ( 'page' === $target && $page_id ) {
					$args = array(
						'menu-item-title'     => $title,
						'menu-item-object'    => 'page',
						'menu-item-object-id' => (int) $page_id,
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
						'menu-item-position'  => $position,
					);
				} else {
					$args = array(
						'menu-item-title'    => $title,
						'menu-item-url'      => 'page' === $target ? home_url( '/portfolio-artemis/' ) : $target,
						'menu-item-type'     => 'custom',
						'menu-item-status'   => 'publish',
						'menu-item-position' => $position,
					);
				}
				$r = wp_update_nav_menu_item( $menu_id, 0, $args );
				if ( is_wp_error( $r ) ) {
					/* translators: 1: item, 2: nome do menu, 3: mensagem de erro. */
					$log[] = sprintf( __( 'Falha ao criar o item %1$s do menu %2$s: %3$s', 'artemis' ), $title, $name, $r->get_error_message() );
				}
				$position++;
			}
			/* translators: %s: nome do menu. */
			$log[] = sprintf( __( 'Menu criado: %s', 'artemis' ), $name );
		}

		$locations[ $location ] = $menu_id;
		$changed                = true;
		/* translators: 1: nome do menu, 2: local do menu. */
		$log[] = sprintf( __( 'Menu %1$s atribuído ao local %2$s', 'artemis' ), $name, $location );
	}

	if ( $changed ) {
		set_theme_mod( 'nav_menu_locations', $locations );
	}
}

/** Links permanentes /%postname%/ se estiverem no padrão simples; atualiza as regras de URL. */
function artemis_pf_seed_permalinks( array &$log ) {
	global $wp_rewrite;

	$changed = false;
	if ( '' === (string) get_option( 'permalink_structure' ) ) {
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$changed = true;
		$log[]   = __( 'Links permanentes definidos como /%postname%/.', 'artemis' );
	}

	// .htaccess (Apache) quando possível: as funções vêm de wp-admin/includes (já carregadas no painel).
	if ( ! function_exists( 'save_mod_rewrite_rules' ) && is_readable( ABSPATH . 'wp-admin/includes/misc.php' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
	}
	flush_rewrite_rules();

	// Fora do painel (CLI), CPT e taxonomia só registram as regras se os links permanentes já estavam ativos no init:
	// esvazia as regras para o WordPress gerá-las de novo, completas, na próxima requisição.
	if ( $changed && ! is_admin() ) {
		delete_option( 'rewrite_rules' );
	}
	$log[] = __( 'Regras de URL atualizadas.', 'artemis' );
}
