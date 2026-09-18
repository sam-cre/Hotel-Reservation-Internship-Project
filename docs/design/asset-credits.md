# Design asset credits

Status: In use in the local design previews

The hotels and guests in the previews are fictional. Images depict imagined Stillwater properties and do not represent real hotels.

## Property imagery

| Local file                                    | Use                                                 |
| --------------------------------------------- | --------------------------------------------------- |
| `frontend/public/images/hero-harbor.jpg`      | Home hero background (with WebP)                    |
| `frontend/public/images/battery-terrace.jpg`  | The Battery (Charleston)                            |
| `frontend/public/images/calhoun-lobby.jpg`    | The Calhoun (Charleston) and The Forsyth (Savannah) |
| `frontend/public/images/aoyama-tokyo.jpg`     | The Aoyama (Tokyo)                                  |
| `frontend/public/images/marunouchi-tokyo.jpg` | The Marunouchi (Tokyo)                              |
| `frontend/public/images/kamogawa-kyoto.jpg`   | The Kamogawa (Kyoto)                                |
| `frontend/public/images/bund-shanghai.jpg`    | The Bund (Shanghai)                                 |
| `frontend/public/images/marais-paris.jpg`     | The Marais (Paris)                                  |
| `frontend/public/images/gramercy-nyc.jpg`     | The Gramercy (New York)                             |

These fictional property images were generated for this project with OpenAI image generation to a shared editorial style. They contain no embedded text or third-party marks. Local copies are used so the site does not make runtime image-service requests. The Calhoun image is reused for The Forsyth in Savannah until that property receives its own approved photography.

## Image optimization (WebP)

Every raster image ships in two formats. A modern WebP file carries the site, and the original JPEG stays as the fallback for any browser that cannot decode WebP. The `Photo` component (`frontend/src/components/ui/Photo.jsx`) renders a `<picture>` element that offers the WebP source and falls back to the `<img>` source; the WebP path is derived from the stored image URL by swapping the file extension, so seed data and the database keep referencing the `.jpg` path unchanged.

WebP conversion is a one-time build step, not a runtime pipeline. The current files were produced from the source images with `sharp` at quality 78 to 80. Typical savings are 40 to 50 percent over the source JPEG (for example, `battery-terrace.jpg` 332 KB becomes `battery-terrace.webp` 202 KB; the 3.4 MB hero PNG becomes a 186 KB WebP). To regenerate after adding or replacing an image, install `sharp` locally without saving it to the manifest and convert each file to a sibling `.webp`:

```
npm install sharp --no-save
node -e "const s=require('sharp');['hero-harbor','battery-terrace','calhoun-lobby','aoyama-tokyo','marunouchi-tokyo','kamogawa-kyoto','bund-shanghai','marais-paris','gramercy-nyc'].forEach(n=>s('frontend/public/images/'+n+'.jpg').webp({quality:80}).toFile('frontend/public/images/'+n+'.webp'))"
```

The six worldwide-property images were generated at 1536x1024, then resized to the site standard 1200x800 and written as both `.jpg` (quality 82) and `.webp` (quality 80).

`sharp` is intentionally not a project dependency, so it never runs during the Vercel or CI build.

## Brand mark

The Stillwater architectural-water mark is an original SVG in the `Brand` component. Its tower, curved side forms, and three water reflections were developed from the owner's selected AI-generated concept and redrawn as flat vector geometry. The website does not load the raster concept file.

## Fonts and icons

- Newsreader and Manrope are installed through Fontsource and served locally. Their packages include their Open Font License notices.
- Lucide icons are installed through `lucide-react`; its package contains the ISC license.
- The Stillwater architectural-water mark is rendered as inline SVG, so it stays sharp and inherits the surrounding text color.

No third-party image, font, or icon service is contacted while browsing these previews.
