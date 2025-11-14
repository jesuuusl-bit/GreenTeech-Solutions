import React from 'react';
import * as Sentry from '@sentry/react';

function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
    >
      Break the world (Sentry Test)
    </button>
  );
}

export default ErrorButton;
