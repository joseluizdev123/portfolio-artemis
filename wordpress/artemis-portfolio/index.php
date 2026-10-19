<?php
/**
 * Fallback obrigatório do WordPress. Este tema existe para a página Portfólio (template "Portfólio"):
 * aqui só aparece um aviso com o link para ela (ou para o seeder, se ela ainda não existe).
 */

defined( 'ABSPATH' ) || exit;

get_header();
$artemis_pf_pagina = artemis_pf_pagina_id();
?>
<main>
	<section class="pf-hero">
		<div class="pf-wrap">
			<div class="pf-hero__intro">
				<p class="pf-eyebrow"><?php esc_html_e( 'Studio Artemis — Portfólio (prévia)', 'artemis' ); ?></p>
				<?php if ( $artemis_pf_pagina ) : ?>
					<p class="pf-hero__lead"><a href="<?php echo esc_url( get_permalink( $artemis_pf_pagina ) ); ?>"><?php esc_html_e( 'Abrir a página Portfólio', 'artemis' ); ?></a></p>
				<?php else : ?>
					<p class="pf-hero__lead"><?php esc_html_e( 'A página Portfólio ainda não existe. No painel: Aparência → Portfólio: popular conteúdo.', 'artemis' ); ?></p>
				<?php endif; ?>
			</div>
		</div>
	</section>
</main>
<?php
get_footer();
