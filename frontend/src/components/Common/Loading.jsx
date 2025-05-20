import React from 'react';

const Loading = ({ message = 'Загрузка...' }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center p-5">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Загрузка...</span>
      </div>
      <p className="text-center">{message}</p>
    </div>
  );
};

export default Loading;
