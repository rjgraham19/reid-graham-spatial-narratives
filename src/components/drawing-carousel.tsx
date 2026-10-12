import { ProjectGallery, type GallerySlide } from "@/components/project-gallery";
import { designId } from "@/lib/design-ids";
import { mediaDims } from "@/lib/media-dims";
import type { MediaItem } from "@/lib/projects";
import frontOverview from "@/assets/rg/lollapalooza-drafting-front-bar-overview.png";
import frontViews from "@/assets/rg/lollapalooza-drafting-front-bar-views.png";
import backOverview from "@/assets/rg/lollapalooza-drafting-back-bar.png";

// These exports include wide blank paper margins. Frame only the content,
// with a generous 60px paper border. Key by source so a replacement
// uploaded in Design Mode is never cropped.
const paperFrames: Record<string, [number, number, number, number]> = {
  [frontOverview]: [143, 323, 2024, 1179],
  [frontViews]: [125, 323, 2092, 1096],
  [backOverview]: [144, 323, 2038, 1171],
};

export function DrawingCarousel({ slug, items }: {
  slug: string;
  items: { item: MediaItem; index: number }[];
}) {
  const slides: GallerySlide[] = items.map(({ item }, i) => {
    const caption = item.caption?.trim() || `Drawing ${i + 1}`;
    const frame = paperFrames[item.src];
    const { width = 16, height = 10 } = mediaDims(item.src);
    return {
      id: item.id!,
      caption,
      src: item.src,
      alt: item.caption?.trim() ? `Technical drawing — ${caption}` : "Technical drawing",
      designId: designId.projectMedia(slug, item.id!),
      aspect: frame ? frame[2] / frame[3] : width / height,
      trim: frame ? { x: frame[0], y: frame[1], width: frame[2], height: frame[3], sourceWidth: width } : undefined,
    };
  });

  return <ProjectGallery label="Technical Drawings" slides={slides} accent="#E20074" stageAspect={16 / 10} fit="contain" stageClassName="bg-white" itemNoun="drawing" />;
}
