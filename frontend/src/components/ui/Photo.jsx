// Serves a WebP version of a raster image with the original as the fallback.
// The WebP path is derived from the source by swapping the file extension, so
// callers keep passing the stored .jpg/.png URL and browsers that support WebP
// download the smaller file. A source with no known raster extension (or an
// already-WebP source) renders as a plain image.
export function Photo({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
}) {
  const webp =
    typeof src === 'string' ? src.replace(/\.(jpe?g|png)$/i, '.webp') : src;
  const hasWebp = webp !== src;
  return (
    <picture>
      {hasWebp && <source type="image/webp" srcSet={webp} />}
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
