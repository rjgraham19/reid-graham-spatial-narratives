/**
 * Intrinsic pixel size of every project image (generated from the files —
 * re-run the media-dims script when images are added or swapped).
 *
 * Used to give <img> its width/height attributes, so the browser reserves
 * the right box before the file arrives and the page doesn't jump as lazy
 * images load. Keyed by the same URL the image is rendered with.
 */
import m_anne_frank_detail from "@/assets/rg/anne-frank-detail.jpg";
import m_anne_frank_full from "@/assets/rg/anne-frank-full.jpg";
import m_exchange_nibi_render from "@/assets/rg/exchange-nibi-render.png";
import m_exchange_render from "@/assets/rg/exchange-render.jpg";
import m_exchange_steam_render from "@/assets/rg/exchange-steam-render.png";
import m_exchange_wavescape_render from "@/assets/rg/exchange-wavescape-render.png";
import m_field_house_full from "@/assets/rg/field-house-full.jpg";
import m_hero_payphone from "@/assets/rg/hero-payphone.jpg";
import m_highlight_drafting from "@/assets/rg/highlight-drafting.jpg";
import m_highlight_exchange from "@/assets/rg/highlight-exchange.jpg";
import m_highlight_field_house from "@/assets/rg/highlight-field-house.jpg";
import m_highlight_illustration from "@/assets/rg/highlight-illustration.jpg";
import m_highlight_physical_models from "@/assets/rg/highlight-physical-models.jpg";
import m_highlight_renderings from "@/assets/rg/highlight-renderings.jpg";
import m_highlight_staging from "@/assets/rg/highlight-staging.jpg";
import m_highlight_townhouse from "@/assets/rg/highlight-townhouse.jpg";
import m_highlight_true_west from "@/assets/rg/highlight-true-west.jpg";
import m_lollapalooza_clubmagenta from "@/assets/rg/lollapalooza-clubmagenta.jpg";
import m_lollapalooza_drafting_back_bar from "@/assets/rg/lollapalooza-drafting-back-bar.png";
import m_lollapalooza_drafting_front_bar_overview from "@/assets/rg/lollapalooza-drafting-front-bar-overview.png";
import m_lollapalooza_drafting_front_bar_views from "@/assets/rg/lollapalooza-drafting-front-bar-views.png";
import m_lollapalooza_drafting_mirror_wall from "@/assets/rg/lollapalooza-drafting-mirror-wall.jpg";
import m_lollapalooza_drafting_record_player from "@/assets/rg/lollapalooza-drafting-record-player.jpg";
import m_lollapalooza_drafting_sofa_groundplan from "@/assets/rg/lollapalooza-drafting-sofa-groundplan.jpg";
import m_lollapalooza_gallery_dj_booth from "@/assets/rg/lollapalooza-gallery-dj-booth.jpg";
import m_lollapalooza_gallery_friends_group from "@/assets/rg/lollapalooza-gallery-friends-group.jpg";
import m_lollapalooza_gallery_lounge_interior from "@/assets/rg/lollapalooza-gallery-lounge-interior.jpg";
import m_lollapalooza_gallery_lounge_path from "@/assets/rg/lollapalooza-gallery-lounge-path.jpg";
import m_lollapalooza_gallery_record_install from "@/assets/rg/lollapalooza-gallery-record-install.jpg";
import m_lollapalooza_render_day from "@/assets/rg/lollapalooza-render-day.jpg";
import m_lollapalooza_render_full from "@/assets/rg/lollapalooza-render-full.jpg";
import m_lollapalooza_render_night_poster from "@/assets/rg/lollapalooza-render-night-poster.jpg";
import m_lollapalooza_render_night from "@/assets/rg/lollapalooza-render-night.jpg";
import m_lollapalooza_render_oasis from "@/assets/rg/lollapalooza-render-oasis.jpg";
import m_rags_riches_country_close from "@/assets/rg/rags-riches-country-close.jpg";
import m_rags_riches_country_full from "@/assets/rg/rags-riches-country-full.jpg";
import m_rags_riches_full from "@/assets/rg/rags-riches-full.jpg";
import m_rags_riches_zoltar from "@/assets/rg/rags-riches-zoltar.jpg";
import m_reshuffling_full from "@/assets/rg/reshuffling-full.jpg";
import m_reshuffling_view1 from "@/assets/rg/reshuffling-view1.jpg";
import m_reshuffling_view2 from "@/assets/rg/reshuffling-view2.jpg";
import m_staging_full from "@/assets/rg/staging-full.jpg";
import m_tab_drawing_left from "@/assets/rg/tab-drawing-left.jpg";
import m_tab_drawing_right from "@/assets/rg/tab-drawing-right.jpg";
import m_tab_full from "@/assets/rg/tab-full.jpg";
import m_true_west_detail from "@/assets/rg/true-west-detail.jpg";
import m_true_west_diagram from "@/assets/rg/true-west-diagram.png";
import m_true_west_full from "@/assets/rg/true-west-full.jpg";
import m_true_west_render1 from "@/assets/rg/true-west-render1.jpg";
import m_true_west_render2 from "@/assets/rg/true-west-render2.jpg";
import m_yctiwy_closeup from "@/assets/rg/yctiwy-closeup.jpg";
import m_yctiwy_drawing_display from "@/assets/rg/yctiwy-drawing-display.png";
import m_yctiwy_drawing from "@/assets/rg/yctiwy-drawing.png";
import m_yctiwy_fullview from "@/assets/rg/yctiwy-fullview.jpg";
import m_yctiwy_sketch from "@/assets/rg/yctiwy-sketch.png";

const DIMS: Record<string, [number, number]> = {
  [m_anne_frank_detail]: [1620, 1080],
  [m_anne_frank_full]: [1612, 1080],
  [m_exchange_nibi_render]: [1332, 934],
  [m_exchange_render]: [5100, 3300],
  [m_exchange_steam_render]: [1341, 1035],
  [m_exchange_wavescape_render]: [1332, 1101],
  [m_field_house_full]: [2400, 1552],
  [m_hero_payphone]: [2547, 1799],
  [m_highlight_drafting]: [1200, 1600],
  [m_highlight_exchange]: [1600, 1036],
  [m_highlight_field_house]: [1600, 1036],
  [m_highlight_illustration]: [1600, 1574],
  [m_highlight_physical_models]: [1600, 976],
  [m_highlight_renderings]: [1600, 1130],
  [m_highlight_staging]: [1384, 1600],
  [m_highlight_townhouse]: [546, 473],
  [m_highlight_true_west]: [1600, 900],
  [m_lollapalooza_clubmagenta]: [2200, 1238],
  [m_lollapalooza_drafting_back_bar]: [2376, 1836],
  [m_lollapalooza_drafting_front_bar_overview]: [2376, 1836],
  [m_lollapalooza_drafting_front_bar_views]: [2376, 1836],
  [m_lollapalooza_drafting_mirror_wall]: [5168, 3300],
  [m_lollapalooza_drafting_record_player]: [5100, 3300],
  [m_lollapalooza_drafting_sofa_groundplan]: [5092, 3265],
  [m_lollapalooza_gallery_dj_booth]: [1600, 2400],
  [m_lollapalooza_gallery_friends_group]: [800, 1200],
  [m_lollapalooza_gallery_lounge_interior]: [2400, 1600],
  [m_lollapalooza_gallery_lounge_path]: [2400, 1600],
  [m_lollapalooza_gallery_record_install]: [800, 1200],
  [m_lollapalooza_render_day]: [1920, 1080],
  [m_lollapalooza_render_full]: [2000, 1444],
  [m_lollapalooza_render_night_poster]: [1600, 900],
  [m_lollapalooza_render_night]: [1920, 1080],
  [m_lollapalooza_render_oasis]: [2000, 1240],
  [m_rags_riches_country_close]: [2000, 1605],
  [m_rags_riches_country_full]: [2000, 1340],
  [m_rags_riches_full]: [2000, 1172],
  [m_rags_riches_zoltar]: [2000, 1338],
  [m_reshuffling_full]: [1989, 2219],
  [m_reshuffling_view1]: [1680, 1149],
  [m_reshuffling_view2]: [1680, 1149],
  [m_staging_full]: [2000, 2310],
  [m_tab_drawing_left]: [1584, 2891],
  [m_tab_drawing_right]: [2400, 2711],
  [m_tab_full]: [1929, 1329],
  [m_true_west_detail]: [5876, 3910],
  [m_true_west_diagram]: [8000, 3542],
  [m_true_west_full]: [5632, 3168],
  [m_true_west_render1]: [1280, 551],
  [m_true_west_render2]: [1280, 561],
  [m_yctiwy_closeup]: [1395, 1865],
  [m_yctiwy_drawing_display]: [1800, 1166],
  [m_yctiwy_drawing]: [9297, 6020],
  [m_yctiwy_fullview]: [5109, 3309],
  [m_yctiwy_sketch]: [3000, 3000],
  "/design-media/field-house/CROPPED_FIELDHOUSE_AXONPERSPECTIVE.jpg": [4465, 2873],
  "/design-media/field-house/FIELDHOUSE_CROPPEDSECTION.jpg": [4413, 1547],
  "/design-media/field-house/FIELDHOUSE_ILLUSTRATION.jpg": [1224, 792],
  "/design-media/field-house/FIELDHOUSE_RESIZED_GP1.jpg": [2000, 2526],
  "/design-media/field-house/FIELDHOUSE_RESIZED_GP2.jpg": [2000, 2526],
  "/design-media/staging-aesthetics/aesthetics.jpeg.png": [2240, 3360],
  "/design-media/the-exchange-facility/EXCHANGE_DIAGRAM.jpg": [8000, 4500],
  "/design-media/the-exchange-facility/EXCHANGE_NIBIOASIS.jpg": [5100, 3300],
  "/design-media/the-exchange-facility/EXCHANGE_NIBI_EDITEDRENDER.png": [1332, 934],
  "/design-media/the-exchange-facility/EXCHANGE_STEAMSANCTUARY.jpg": [5100, 3300],
  "/design-media/the-exchange-facility/EXCHANGE_STEAM_EDITEDRENDER.png": [1341, 1035],
  "/design-media/the-exchange-facility/EXCHANGE_VERTICALSECTION.png": [5100, 3300],
  "/design-media/the-exchange-facility/EXCHANGE_WAVESCAPE.jpg": [5100, 3300],
  "/design-media/the-exchange-facility/EXCHANGE_WAVESCAPE_EDITEDRENDER.png": [1332, 1101],
  "/design-media/townhouse/TOWNHOUSE_AXONX2.png": [1865, 1143],
  "/design-media/townhouse/TOWNHOUSE_AXON_UPRIGHT.jpg": [1143, 1865],
  "/design-media/townhouse/TOWNHOUSE_RENDER1.jpg": [1184, 1035],
  "/design-media/townhouse/TOWNHOUSE_RENDER12.jpg": [1920, 1080],
  "/design-media/townhouse/TOWNHOUSE_RENDER3.jpg": [1403, 1038],
  "/design-media/true-west/CROPPED_PANTONEWEST.png": [1845, 1849],
  "/design-media/true-west/TRUEWEST_DRAWING_4096.png": [4096, 1814],
};

/** `{ width, height }` for an image URL, or nothing if it isn't known. */
export function mediaDims(src: string | undefined): { width?: number; height?: number } {
  const d = src ? DIMS[src] : undefined;
  return d ? { width: d[0], height: d[1] } : {};
}
