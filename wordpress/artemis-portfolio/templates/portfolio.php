<?php
/**
 * Template Name: Portfólio
 * Template Post Type: page
 *
 * Página Portfólio — espelha index.html (estático). Seções em template-parts/portfolio/, na ordem de src/partials/.
 * Textos: caixas na tela de edição desta página (inc/pagina.php). Projetos: Portfólio → Projetos (inc/cpt-projeto.php).
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>

<main>
<?php
foreach ( array( '01-hero', '02-filtro', '03-destaque', '04-projetos', '05-cta' ) as $artemis_pf_parte ) {
	get_template_part( 'template-parts/portfolio/' . $artemis_pf_parte );
}
?>
</main>

<?php
get_footer();
