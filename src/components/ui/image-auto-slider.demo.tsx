// Usage examples for <ImageAutoSlider />. Not imported by the app.
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";

/** Defaults — Unsplash placeholders, right-to-left, 40s pass. */
export function DemoOne() {
  return (
    <div className="bg-background py-10">
      <ImageAutoSlider />
    </div>
  );
}

/** Custom set, faster, scrolling the other way. */
export function DemoTwo() {
  return (
    <div className="bg-background py-10">
      <ImageAutoSlider
        speedSeconds={26}
        reverse
        images={[
          "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=1600&auto=format&fit=crop",
        ]}
      />
    </div>
  );
}
