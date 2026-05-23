import ComingSoon from "@/components/ui/ComingSoon";

export default function NotFound() {
  return (
    <ComingSoon
      index="§ 404"
      eyebrow="Not found"
      title={
        <>
          This page
          <br />
          <span
            className="italic font-[280]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 80' }}
          >
            has been stripped.
          </span>
        </>
      }
      description="The page you were looking for either doesn't exist, or hasn't been written yet."
    />
  );
}
