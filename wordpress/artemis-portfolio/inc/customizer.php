<?php
/**
 * Header e rodapé — Personalizar → "Portfólio: header" e "Portfólio: rodapé" (globais, como no tema oficial).
 * Os links do menu e das colunas do rodapé ficam em Aparência → Menus (posições registradas em functions.php);
 * sem menu atribuído, valem os links do design.
 */

defined( 'ABSPATH' ) || exit;

/** Seções => [título, [chave => [rótulo, tipo (text|textarea|url), padrão]]]. Padrões = texto do design. */
function artemis_pf_mod_campos() {
	return array(
		'artemis_pf_header' => array(
			__( 'Portfólio: header', 'artemis' ),
			array(
				'art_pf_logo_url'  => array( __( 'Link do logo', 'artemis' ), 'url', 'https://studioartemis.co/' ),
				'art_pf_selo'      => array( __( 'Selo ao lado do logo', 'artemis' ), 'text', 'Portfólio' ),
				'art_pf_cta_texto' => array( __( 'Botão do topo — texto', 'artemis' ), 'text', 'Comece um projeto' ),
				'art_pf_cta_url'   => array( __( 'Botão do topo — link', 'artemis' ), 'url', 'https://studioartemis.co/contato' ),
			),
		),
		'artemis_pf_rodape' => array(
			__( 'Portfólio: rodapé', 'artemis' ),
			array(
				'art_pf_rod_frase'       => array( __( 'Frase ao lado do logo — {entre chaves} o trecho em cinza', 'artemis' ), 'textarea', 'Automação aplicada à operação, direto no seu e-mail. {Publicamos quando temos algo concreto para dizer.}' ),
				'art_pf_news_campo'      => array( __( 'Newsletter — texto dentro do campo', 'artemis' ), 'text', 'Seu endereço de e-mail' ),
				'art_pf_news_botao'      => array( __( 'Newsletter — botão', 'artemis' ), 'text', 'Enviar' ),
				'art_pf_news_action'     => array( __( 'Newsletter — endereço de envio do formulário (vazio = prévia: só mostra o aviso)', 'artemis' ), 'url', '' ),
				'art_pf_news_aviso'      => array( __( 'Newsletter — aviso da prévia', 'artemis' ), 'text', 'Prévia: o cadastro na newsletter ainda não está ligado nesta página.' ),
				'art_pf_rod_col1'        => array( __( 'Título da 1ª coluna de links', 'artemis' ), 'text', 'Artemis' ),
				'art_pf_rod_col2'        => array( __( 'Título da 2ª coluna de links', 'artemis' ), 'text', 'Outras linhas' ),
				'art_pf_rod_email_rot'   => array( __( 'Contato — rótulo do e-mail', 'artemis' ), 'text', 'Fale conosco' ),
				'art_pf_rod_email'       => array( __( 'Contato — e-mail', 'artemis' ), 'text', 'contato@studioartemis.co' ),
				'art_pf_rod_whats_rot'   => array( __( 'Contato — rótulo do WhatsApp', 'artemis' ), 'text', 'WhatsApp' ),
				'art_pf_rod_whats'       => array( __( 'Contato — WhatsApp (como aparece; o link é montado)', 'artemis' ), 'text', '+55 (48) 0000-0000' ),
				'art_pf_rod_end_rot'     => array( __( 'Contato — rótulo do endereço', 'artemis' ), 'text', 'Endereço' ),
				'art_pf_rod_end'         => array( __( 'Contato — endereço', 'artemis' ), 'text', 'R. Fúlvio Aducci, 416 — Florianópolis, SC' ),
				'art_pf_rod_social'      => array( __( 'Rótulo das redes sociais', 'artemis' ), 'text', 'Social' ),
				'art_pf_rod_instagram'   => array( __( 'Instagram — link ("-" esconde o ícone; vale para todas as redes)', 'artemis' ), 'url', '#' ),
				'art_pf_rod_youtube'     => array( __( 'YouTube — link', 'artemis' ), 'url', '#' ),
				'art_pf_rod_linkedin'    => array( __( 'LinkedIn — link', 'artemis' ), 'url', '#' ),
				'art_pf_rod_behance'     => array( __( 'Behance — link', 'artemis' ), 'url', '#' ),
				'art_pf_rod_dribbble'    => array( __( 'Dribbble — link', 'artemis' ), 'url', '#' ),
				'art_pf_rod_x'           => array( __( 'X (Twitter) — link', 'artemis' ), 'url', '#' ),
				'art_pf_rod_topo'        => array( __( 'Texto "Voltar ao topo"', 'artemis' ), 'text', 'Voltar ao topo' ),
				'art_pf_rod_copyright'   => array( __( 'Linha de direitos', 'artemis' ), 'text', '© 2026 Studio Artemis. Todos os direitos reservados.' ),
			),
		),
	);
}

/** Todos os campos do Personalizar numa lista só: chave => [rotulo, tipo, padrao]. */
function artemis_pf_mod_campos_planos() {
	static $planos = null;
	if ( null === $planos ) {
		$planos = array();
		foreach ( artemis_pf_mod_campos() as $secao ) {
			foreach ( $secao[1] as $key => $c ) {
				$planos[ $key ] = array( 'rotulo' => $c[0], 'tipo' => $c[1], 'padrao' => $c[2] );
			}
		}
	}
	return $planos;
}

add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_panel( 'artemis_pf', array(
		'title'    => __( 'Portfólio: header e rodapé', 'artemis' ),
		'priority' => 30,
	) );
	foreach ( artemis_pf_mod_campos() as $secao_id => $secao ) {
		$wp_customize->add_section( $secao_id, array(
			'title' => $secao[0],
			'panel' => 'artemis_pf',
		) );
		foreach ( $secao[1] as $key => $c ) {
			list( $rotulo, $tipo, $padrao ) = $c;
			$wp_customize->add_setting( $key, array(
				'default'           => $padrao,
				'sanitize_callback' => function ( $valor ) use ( $tipo ) {
					// "#" (rede ainda sem endereço, como no design) e "-" (rede escondida) ficam como estão
					return ( 'url' === $tipo && in_array( trim( (string) $valor ), array( '#', '-' ), true ) ) ? trim( (string) $valor ) : artemis_pf_limpa( $valor, $tipo );
				},
				'transport'         => 'refresh',
			) );
			$wp_customize->add_control( $key, array(
				'label'   => $rotulo,
				'section' => $secao_id,
				'type'    => 'textarea' === $tipo ? 'textarea' : ( 'url' === $tipo ? 'url' : 'text' ),
			) );
		}
	}
} );

/** Link do WhatsApp a partir do número como aparece (sem código do país, assume +55) — igual ao tema oficial. */
function artemis_pf_whatsapp_url( $numero ) {
	$numero = trim( (string) $numero );
	$digitos = preg_replace( '/\D+/', '', $numero );
	if ( '' === $digitos ) {
		return '';
	}
	$digitos = ltrim( $digitos, '0' );
	if ( '+' !== substr( $numero, 0, 1 ) && strlen( $digitos ) <= 11 ) {
		$digitos = '55' . $digitos;
	}
	return 'https://wa.me/' . $digitos;
}

/** Links do design para as colunas e os links legais do rodapé (reserva enquanto os menus não existem). */
function artemis_pf_rodape_reservas() {
	return array(
		'pf_rodape_artemis' => array(
			array( 'Serviços', 'https://studioartemis.co/servicos', false ),
			array( 'Estudos de impacto', 'https://studioartemis.co/#estudos', false ),
			array( 'Portfólio', 'https://studioartemis.co/portfolio-artemis/', false ),
			array( 'Blog', 'https://studioartemis.co/blog', false ),
			array( 'Sobre', 'https://studioartemis.co/sobre', false ),
			array( 'Contato', 'https://studioartemis.co/contato', false ),
		),
		'pf_rodape_linhas'  => array(
			array( 'Artemis SEO', 'https://studioartemis.co/artemis-seo/', false ),
			array( 'MktOps', 'https://studioartemis.co/mktops/', false ),
		),
		'pf_legal'          => array(
			array( 'Política de privacidade', 'https://studioartemis.co/politica-de-privacidade', false ),
			array( 'Termos de uso', 'https://studioartemis.co/termos-de-uso', false ),
		),
	);
}
