# Owner-provided media — upload after launch

Owner requested on 24 October 2026 that these files be uploaded to the Island to Infinity website **after launch**. This is an addition to the current release work, not a request to replace it. Do not publish the assets before that condition is met.

| Asset | Local original | Verified metadata |
| --- | --- | --- |
| Zhixing documentary | `/Users/elaine/Desktop/Zhixing/Island to Infinity.mov` | 195,642,331 bytes; 183.1 seconds; 1920×1080 |
| This year's group photograph | `/Users/elaine/Desktop/Zhixing/Island to Infinity Groupphoto.jpg` | 7,954,163 bytes |

Both originals are preserved. After deployment acceptance, a web-compatible H.264/AAC MP4 (1280×720, 183.1 seconds, 15,565,945 bytes) and an EXIF-stripped responsive WebP photograph were prepared and uploaded to a private Supabase bucket. Byte-for-byte download verification passed for both, and anonymous public URLs were denied. Initially no public link was created. After deployment acceptance and the owner’s separate authorization confirmations, both assets were published through the normal CMS. Storage buckets remain private. The private object receipt stays outside Git in the restricted project `private-media` directory.

On 24 October 2026 the owner explicitly confirmed public-display authorization for every identifiable member in the photograph and, separately, authorization from interviewees to publish the complete documentary. A frame review identified family interviews; this separate documentary confirmation was obtained before any public linking. Once cleared, place the media in the project introduction area using the existing warm palette/layout, and verify playback, mobile layout and accessible controls. Use persistent hosting within the approved free plan; inspect file-size limits before uploading. Do not enable autoplay with sound. Do not alter the existing logo palette or redesign the page around the new media.

The homepage editor now supports the stored documentary, title, caption and public-display authorization. The player uses native controls, inline playback and no autoplay. Video bytes remain in private storage: the server checks the fresh published consent state before issuing a two-minute playback link; Storage serves byte ranges directly. New links stop immediately after unpublishing/removing the video; already issued links can last up to two minutes. The existing photo pipeline remains private and checks the current public snapshot on each request.

## Published and checked

Published on 24 October 2026 at https://islandtoinfinity.online/ after production acceptance. The photograph is served through the existing authorization-aware WebP route. The documentary appears in the introduction area with native playback controls, inline playback and no autoplay. Public homepage HTML includes both assets. The photograph returns 200; video playback issues a short-lived 307 link and Storage returns 206 for beginning/end byte ranges. Originals remain unchanged. Evidence: `production-media-result.json`; private object receipt and original-content backup remain outside Git.
