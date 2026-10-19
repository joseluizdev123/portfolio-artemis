<?php
/**
 * Footer — mesma marcação de src/partials/footer.html — e fim do documento.
 * Textos e contatos: Personalizar → Portfólio: rodapé. Colunas e links legais: Aparência → Menus (sem menu: links do design).
 */

defined( 'ABSPATH' ) || exit;

$artemis_pf_res    = artemis_pf_rodape_reservas();
$artemis_pf_col1   = artemis_pf_menu_itens( 'pf_rodape_artemis', $artemis_pf_res['pf_rodape_artemis'] );
$artemis_pf_col2   = artemis_pf_menu_itens( 'pf_rodape_linhas', $artemis_pf_res['pf_rodape_linhas'] );
$artemis_pf_legal  = artemis_pf_menu_itens( 'pf_legal', $artemis_pf_res['pf_legal'] );
$artemis_pf_action = artemis_pf_mod( 'art_pf_news_action' );
$artemis_pf_email  = artemis_pf_mod( 'art_pf_rod_email' );
$artemis_pf_redes  = array(
	'art_pf_rod_instagram' => array( 'Instagram', 'instagram.svg' ),
	'art_pf_rod_youtube'   => array( 'YouTube', 'youtube.svg' ),
	'art_pf_rod_linkedin'  => array( 'LinkedIn', 'linkedin.svg' ),
	'art_pf_rod_behance'   => array( 'Behance', 'behance.svg' ),
	'art_pf_rod_dribbble'  => array( 'Dribbble', 'dribbble.svg' ),
	'art_pf_rod_x'         => array( 'X (Twitter)', 'x.svg' ),
);
?>

<!-- Footer (design/Main.dc.html .ftr) -->
<footer class="pf-ftr">
<div class="pf-wrap">
<div class="pf-ftr__top">
<div>
<a href="<?php echo esc_url( artemis_pf_mod( 'art_pf_logo_url' ) ); ?>" aria-label="<?php esc_attr_e( 'Studio Artemis — página inicial', 'artemis' ); ?>"><img src="<?php echo esc_url( artemis_pf_asset( 'images/footer/logo-lockup.svg' ) ); ?>" width="137" height="32" alt="Artemis"></a>
<p class="pf-ftr__claim"><?php echo artemis_pf_rico( artemis_pf_mod( 'art_pf_rod_frase' ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- escapado em artemis_pf_rico() ?></p>
<!-- Newsletter: sem endereço de envio (Personalizar) o envio é interceptado no JS e avisa abaixo do campo -->
<form class="pf-ftr__form" action="<?php echo $artemis_pf_action ? esc_url( $artemis_pf_action ) : '#'; ?>" method="post"<?php echo $artemis_pf_action ? '' : ' data-pf-newsletter'; ?> data-aviso="<?php echo esc_attr( artemis_pf_mod( 'art_pf_news_aviso' ) ); ?>">
<label for="ftr-email" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)"><?php echo esc_html( artemis_pf_mod( 'art_pf_news_campo' ) ); ?></label>
<input class="pf-ftr__input" id="ftr-email" type="email" name="email" placeholder="<?php echo esc_attr( artemis_pf_mod( 'art_pf_news_campo' ) ); ?>" autocomplete="email" required>
<button class="pf-btn pf-btn--pri" type="submit"><?php echo esc_html( artemis_pf_mod( 'art_pf_news_botao' ) ); ?></button>
</form>
<p class="pf-ftr__msg" role="status" aria-live="polite" data-extra></p>
</div>
<div class="pf-ftr__cols">
<nav aria-labelledby="ftr-a">
<h2 class="pf-ftr__h" id="ftr-a"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_col1' ) ); ?></h2>
<ul class="pf-ftr__links">
<?php foreach ( $artemis_pf_col1 as $artemis_pf_item ) : ?>
<li><a href="<?php echo esc_url( $artemis_pf_item[1] ); ?>"><?php echo esc_html( $artemis_pf_item[0] ); ?></a></li>
<?php endforeach; ?>
</ul>
</nav>
<nav aria-labelledby="ftr-b">
<h2 class="pf-ftr__h" id="ftr-b"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_col2' ) ); ?></h2>
<ul class="pf-ftr__links">
<?php foreach ( $artemis_pf_col2 as $artemis_pf_item ) : ?>
<li><a href="<?php echo esc_url( $artemis_pf_item[1] ); ?>"><?php echo esc_html( $artemis_pf_item[0] ); ?></a></li>
<?php endforeach; ?>
</ul>
</nav>
<address class="pf-ftr__contact" style="font-style: normal">
<p class="pf-ftr__label"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_email_rot' ) ); ?></p>
<a class="pf-ftr__val" href="<?php echo esc_url( 'mailto:' . $artemis_pf_email ); ?>"><?php echo esc_html( $artemis_pf_email ); ?></a>
<p class="pf-ftr__label"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_whats_rot' ) ); ?></p>
<a class="pf-ftr__val" href="<?php echo esc_url( artemis_pf_whatsapp_url( artemis_pf_mod( 'art_pf_rod_whats' ) ) ); ?>"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_whats' ) ); ?></a>
<p class="pf-ftr__label"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_end_rot' ) ); ?></p>
<p class="pf-ftr__val"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_end' ) ); ?></p>
</address>
</div>
</div>
<div class="pf-ftr__mid">
<div>
<p class="pf-ftr__label"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_social' ) ); ?></p>
<ul class="pf-ftr__icons">
<?php foreach ( $artemis_pf_redes as $artemis_pf_key => $artemis_pf_rede ) : ?>
<li><a class="pf-ico" href="<?php echo esc_url( artemis_pf_mod( $artemis_pf_key ) ); ?>" aria-label="<?php echo esc_attr( $artemis_pf_rede[0] ); ?>"><img src="<?php echo esc_url( artemis_pf_asset( 'images/footer/' . $artemis_pf_rede[1] ) ); ?>" alt=""></a></li>
<?php endforeach; ?>
</ul>
</div>
<a href="#pf-title" style="display: flex; flex-direction: column; align-items: flex-end; gap: 16px"><span class="pf-ftr__label"><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_topo' ) ); ?></span><span class="pf-ico"><img src="<?php echo esc_url( artemis_pf_asset( 'images/footer/chevron-up.svg' ) ); ?>" alt=""></span></a>
</div>
<div class="pf-ftr__legal">
<p><?php echo esc_html( artemis_pf_mod( 'art_pf_rod_copyright' ) ); ?></p>
<div style="display: flex; gap: 24px"><?php foreach ( $artemis_pf_legal as $artemis_pf_item ) : ?><a href="<?php echo esc_url( $artemis_pf_item[1] ); ?>"><?php echo esc_html( $artemis_pf_item[0] ); ?></a><?php endforeach; ?></div>
</div>
</div>
<div class="pf-ftr__pattern" aria-hidden="true"></div>
</footer>

</div>
<?php wp_footer(); ?>
</body>
</html>
