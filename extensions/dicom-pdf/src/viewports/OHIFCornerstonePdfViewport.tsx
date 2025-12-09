import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useViewportRef } from '@ohif/core';
import './OHIFCornerstonePdfViewport.css';

function OHIFCornerstonePdfViewport({
  displaySets,
  viewportId = 'pdf-viewport',
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [style, setStyle] = useState('pdf-yes-click');

  const viewportRef = useViewportRef(viewportId);

  // Drag-to-disable-click (your original feature – kept untouched)
  const makePdfScrollable = () => setStyle('pdf-yes-click');
  const makePdfDropTarget = () => setStyle('pdf-no-click');

  useEffect(() => {
    document.body.addEventListener('drag', makePdfDropTarget);
    return () => document.removeEventListener('drag', makePdfDropTarget);
  }, []);

  if (!displaySets?.length || displaySets.length > 1) {
    return null;
  }

  const displaySet = displaySets[0];

  // Real server URL for proper download (exists in every OHIF v3.7+ dicom-pdf setup)
  const realServerUrl = displaySet.getPdfUrl?.() || displaySet.pdfUrl || null;

  useEffect(() => {
    let cancelled = false;
    displaySet.renderedUrl.then(blob => {
      if (!cancelled) {
        setBlobUrl(blob);
        setDownloadUrl(realServerUrl || blob); // fallback to blob if no real URL
      }
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [displaySet.renderedUrl, realServerUrl]);

  return (
    <div
      className="bg-primary-black relative h-full w-full text-white"
      onClick={makePdfScrollable}
      ref={el => el && viewportRef.register(el)}
      data-viewport-id={viewportId}
    >
      {blobUrl ? (
        <object
          data={`${blobUrl}#view=FitH&toolbar=0&pagemode=none`}
          type="application/pdf"
          className={style}
          style={{ width: '100%', height: '100%', border: 'none' }}
        >
          {/* This fallback shows on Android Firefox, Edge, and sometimes Chrome when inline fails */}
          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 px-6">
            <svg className="mb-8 h-24 w-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>

            <p className="mb-10 text-xl">PDF Report</p>

            {/* SINGLE BUTTON – works everywhere */}
            <a
              href={downloadUrl}
              download={`Report_${(displaySet.SeriesInstanceUID || '').slice(-8) || 'PDF'}.pdf`}
              className="rounded-lg bg-blue-600 px-10 py-5 text-xl font-medium text-white shadow-2xl hover:bg-blue-700"
            >
              Download PDF
            </a>
          </div>
        </object>
      ) : (
        <div className="flex h-full items-center justify-center">
          Loading PDF...
        </div>
      )}
    </div>
  );
}

OHIFCornerstonePdfViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object).isRequired,
  viewportId: PropTypes.string,
};

export default OHIFCornerstonePdfViewport;
