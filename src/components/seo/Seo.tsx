import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://livenzo-room-finder-hub.lovable.app';
export const OG_HOME = `${SITE_URL}/og/livenzo-home.jpg`;
export const OG_ROOMS = `${SITE_URL}/og/livenzo-rooms.jpg`;

interface SeoProps {
  title: string;
  description: string;
  /** Route path, e.g. "/find-room" — used for canonical and og:url */
  path: string;
  /** Absolute https URL of the page-specific preview image */
  image?: string;
  noindex?: boolean;
  /** Optional JSON-LD object (or array of objects) for this page */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route head metadata. Renders no visible UI.
 */
const Seo: React.FC<SeoProps> = ({
  title,
  description,
  path,
  image = OG_HOME,
  noindex,
  jsonLd
}) => {
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd &&
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      }
    </Helmet>);

};

export default Seo;
