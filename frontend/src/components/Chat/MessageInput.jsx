import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const fileInputRef = useRef(null);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setFilePreview('');
      return;
    }

    // Read file as data URL for preview and sending
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: selectedFile.name,
        data: e.target.result
      };
      setFile(fileData);
      setFilePreview(selectedFile.name);
    };
    reader.onerror = () => {
      console.error('Error reading file');
      setFile(null);
      setFilePreview('');
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() === '' && !file) {
      return; // Don't send empty messages
    }
    
    onSendMessage(message, file);
    
    // Reset form
    setMessage('');
    setFile(null);
    setFilePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="d-flex flex-column">
        {filePreview && (
          <div className="mb-2 d-flex align-items-center">
            <span className="badge bg-secondary me-2">Файл: {filePreview}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                setFile(null);
                setFilePreview('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Удалить
            </button>
          </div>
        )}
        
        <div className="d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Введите сообщение..."
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
          />
          
          <label className="btn btn-outline-secondary me-2 mb-0 d-flex align-items-center">
            <input
              type="file"
              className="d-none"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <i className="bi bi-paperclip"></i>
          </label>
          
          <button type="submit" className="btn btn-primary">
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
