import { useState } from 'react';
import { Button } from "@/components/ui";
import {
  FaTimes, 
  FaDownload, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFileImage, 
  FaFileAlt,
  FaEye,
  FaInfoCircle,
  FaUserCircle,
  FaCalendarAlt,
  FaTags,
  FaLock,
  FaGlobe,
  FaUsers
} from 'react-icons/fa';
import { format } from 'date-fns';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const FilePreviewModal = ({ file, onClose, onDownload }) => {
  useBodyScrollLock(true);
  const [activeTab, setActiveTab] = useState('preview');

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FaFilePdf className="text-red-500 text-4xl" />;
    if (fileType?.includes('word')) return <FaFileWord className="text-blue-500 text-4xl" />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FaFileExcel className="text-green-500 text-4xl" />;
    if (fileType?.includes('image')) return <FaFileImage className="text-purple-500 text-4xl" />;
    return <FaFileAlt className="text-gray-500 text-4xl" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAccessIcon = (type) => {
    switch(type) {
      case 'public': return <FaGlobe className="text-green-600" />;
      case 'private': return <FaLock className="text-red-600" />;
      default: return <FaUsers className="text-blue-600" />;
    }
  };

  const isImage = file?.fileType?.includes('image');
  const isPDF = file?.fileType?.includes('pdf');

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.fileType)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {file.originalName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.fileSize)} • Uploaded {format(new Date(file.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b mb-4">
          <nav className="flex space-x-8">
            <Button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaEye className="inline mr-2" />
              Preview
            </Button>
            <Button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaInfoCircle className="inline mr-2" />
              Details
            </Button>
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-[400px] max-h-[500px] overflow-y-auto">
          {activeTab === 'preview' ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              {isImage ? (
                <div className="flex justify-center">
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="max-w-full max-h-[400px] object-contain rounded"
                  />
                </div>
              ) : isPDF ? (
                <div className="text-center p-8">
                  <FaFilePdf className="text-6xl text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">PDF preview not available</p>
                  <Button
                    onClick={() => onDownload(file)}
                    className="btn-primary"
                  >
                    Download to View
                  </Button>
                </div>
              ) : (
                <div className="text-center p-8">
                  {getFileIcon(file.fileType)}
                  <p className="text-gray-600 mt-4 mb-4">
                    Preview not available for this file type
                  </p>
                  <Button
                    onClick={() => onDownload(file)}
                    className="btn-primary"
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* File Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">File Name</p>
                  <p className="font-medium text-sm break-all">{file.originalName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium capitalize">{file.category}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">File Type</p>
                  <p className="font-medium">{file.fileType}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Size</p>
                  <p className="font-medium">{formatFileSize(file.fileSize)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Version</p>
                  <p className="font-medium">{file.version || 1}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Downloads</p>
                  <p className="font-medium">{file.downloadCount || 0}</p>
                </div>
              </div>

              {/* Description */}
              {file.description && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm">{file.description}</p>
                </div>
              )}

              {/* Tags */}
              {file.tags?.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2 flex items-center">
                    <FaTags className="mr-1" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {file.tags.map(tag => (
                      <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Access Control */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Access Control</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getAccessIcon(file.accessControl?.type)}
                    <span className="text-sm capitalize">{file.accessControl?.type || 'restricted'}</span>
                  </div>
                  
                  {file.accessControl?.allowedRoles?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {file.accessControl.allowedRoles.map(role => (
                        <span key={role} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full capitalize">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}

                  {file.accessControl?.allowedDepartments?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {file.accessControl.allowedDepartments.map(dept => (
                        <span key={dept} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {dept}
                        </span>
                      ))}
                    </div>
                  )}

                  {file.accessControl?.expiryDate && (
                    <p className="text-xs text-red-600">
                      Expires: {format(new Date(file.accessControl.expiryDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Uploader Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Upload Information</p>
                <div className="flex items-start space-x-3">
                  <FaUserCircle className="text-gray-400 text-2xl" />
                  <div>
                    <p className="font-medium">{file.uploadedBy?.name}</p>
                    <p className="text-sm text-gray-500">{file.uploadedBy?.email}</p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                      <FaCalendarAlt />
                      <span>{format(new Date(file.createdAt), 'MMM dd, yyyy hh:mm a')}</span>
                    </div>
                    {file.department && (
                      <p className="text-xs text-gray-500 mt-1">Department: {file.department}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Log (Admin only) */}
              {file.activityLog?.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Recent Activity</p>
                  <div className="space-y-2">
                    {file.activityLog.slice(-3).reverse().map((log, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="flex items-center">
                          <span className="capitalize">{log.action}</span>
                          <span className="text-gray-400 mx-1">by</span>
                          <span className="font-medium">{log.user?.name || 'Unknown'}</span>
                        </span>
                        <span className="text-gray-400">
                          {format(new Date(log.timestamp), 'MMM dd, hh:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 mt-4 pt-3 border-t">
          <Button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </Button>
          <Button
            onClick={() => onDownload(file)}
            className="btn-primary flex items-center space-x-2"
          >
            <FaDownload />
            <span>Download</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
