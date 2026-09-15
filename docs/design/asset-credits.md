# Design asset credits

Status: In use in the local design previews

The hotels and guests in the previews are fictional. Images depict imagined Stillwater properties and do not represent real hotels.

## Property imagery

| Local file                                   | Use                                       |
| -------------------------------------------- | ----------------------------------------- |
| `frontend/public/images/battery-terrace.jpg` | The Battery search result                 |
| `frontend/public/images/calhoun-lobby.jpg`   | The Calhoun and The Forsyth search result |

These fictional property images were generated for this project with OpenAI image generation. They contain no embedded text or third-party marks. Local 1600-pixel JPEG copies are used so the previews do not make runtime image-service requests. The Calhoun image is reused for the Savannah sample property until each seeded hotel receives final approved photography.

## Brand mark

The Stillwater architectural-water mark is an original SVG in the `Brand` component. Its tower, curved side forms, and three water reflections were developed from the owner's selected AI-generated concept and redrawn as flat vector geometry. The website does not load the raster concept file.

## Fonts and icons

- Newsreader and Manrope are installed through Fontsource and served locally. Their packages include their Open Font License notices.
- Lucide icons are installed through `lucide-react`; its package contains the ISC license.
- The Stillwater architectural-water mark is rendered as inline SVG, so it stays sharp and inherits the surrounding text color.

No third-party image, font, or icon service is contacted while browsing these previews.
