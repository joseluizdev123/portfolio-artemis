<?php
/**
 * Seção 01 — Hero (= src/partials/portfolio-01-hero.html). Campos: caixa "Portfólio — 1. Topo (hero)".
 */

defined( 'ABSPATH' ) || exit;
?>
<!-- Seção 01 — Hero: campo de pontos em <canvas> que acende perto do cursor (assets/js/portfolio.js) -->
<section class="pf-hero" aria-labelledby="pf-title">
<div class="pf-wrap">
<div class="pf-hero__box">
<canvas class="pf-hero__fx" aria-hidden="true"></canvas>
<div class="pf-hero__glow" aria-hidden="true"></div>
<p class="pf-hero__hint" aria-hidden="true"><?php artemis_pf_e( 'pf_hero_dica' ); ?></p>
<div class="pf-hero__intro">
<p class="pf-eyebrow"><?php artemis_pf_e( 'pf_hero_eyebrow' ); ?></p>
<h1 class="pf-hero__title" id="pf-title"><?php artemis_pf_rico_e( 'pf_hero_titulo' ); ?></h1>
<p class="pf-hero__lead"><?php artemis_pf_e( 'pf_hero_lead' ); ?></p>
</div>
</div>
</div>
</section>
