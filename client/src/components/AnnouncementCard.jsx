import { useState } from 'react';
import { Button, Input } from "@/components/ui";
import { format, formatDistanceToNow } from 'date-fns';
import {
  FaBullhorn,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaCheckCircle,
  FaComment,
  FaPaperclip,
  FaUserCircle,
  FaThumbtack,
  FaBell,
  FaEye,
  FaEdit,
  FaTrash,
  FaBuilding,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AnnouncementCard = ({ announcement, onAcknowledge, onComment, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return <FaExclamationTriangle className="text-red-500" />;
      case 'high': return <FaExclamationTriangle className="text-orange-500" />;
      case 'medium': return <FaInfoCircle className="text-yellow-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'urgent': return <FaExclamationTriangle className="text-red-600" />;
      case 'event': return <FaCalendarAlt className="text-blue-600" />;
      case 'holiday': return <FaBell className="text-green-600" />;
      case 'department': return <FaBuilding className="text-purple-600" />;
      default: return <FaBullhorn className="text-primary-600" />;
    }
  };

  const isRead = announcement.readBy?.some(
    r => (r.user?._id || r.user)?.toString() === user?._id?.toString()
  );
  const isAcknowledged = announcement.acknowledgedBy?.some(
    a => (a.user?._id || a.user)?.toString() === user?._id?.toString()
  );
  const canManage =
    ['admin', 'super_admin'].includes(user?.role) ||
    announcement.createdBy?._id === user?._id;

  const handleAcknowledge = () => {
    onAcknowledge(announcement._id);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(announcement._id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className={`card hover:shadow-lg transition-shadow ${!isRead ? 'border-l-4 border-primary-500' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            announcement.priority === 'urgent' ? 'bg-red-100' :
            announcement.priority === 'high' ? 'bg-orange-100' :
            'bg-blue-100'
          }`}>
            {getTypeIcon(announcement.type)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
              {announcement.pinned && (
                <FaThumbtack className="text-gray-400 rotate-45" title="Pinned" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
              <span className="flex items-center">
                <FaUserCircle className="mr-1" />
                {announcement.createdBy?.name}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <FaCalendarAlt className="mr-1" />
                {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getPriorityColor(announcement.priority)}`}>
            {getPriorityIcon(announcement.priority)}
            <span className="capitalize">{announcement.priority}</span>
          </span>
          {!isRead && (
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 whitespace-pre-line">{announcement.content}</p>
      </div>

      {/* Target Audience */}
      <div className="flex flex-wrap gap-2 mb-4">
        {announcement.targetRoles?.map(role => (
          <span key={role} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
            {role === 'all' ? 'Everyone' : role}
          </span>
        ))}
        {announcement.targetDepartments?.map(dept => (
          <span key={dept} className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
            {dept}
          </span>
        ))}
      </div>

      {/* Attachments */}
      {announcement.attachments?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 flex items-center">
            <FaPaperclip className="mr-1" /> Attachments
          </p>
          <div className="flex flex-wrap gap-2">
            {announcement.attachments.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200"
              >
                {file.filename}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <FaEye className="mr-1" /> {announcement.readBy?.length || 0} views
          </span>
          <span className="flex items-center">
            <FaCheckCircle className="mr-1" /> {announcement.acknowledgedBy?.length || 0} acknowledged
          </span>
          <span className="flex items-center">
            <FaComment className="mr-1" /> {announcement.comments?.length || 0} comments
          </span>
        </div>
        {announcement.expiryDate && (
          <span className="text-xs text-gray-400">
            Expires: {format(new Date(announcement.expiryDate), 'MMM dd, yyyy')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        {!isAcknowledged && (
          <Button
            onClick={handleAcknowledge}
            className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm"
          >
            <FaCheckCircle />
            <span>Acknowledge</span>
          </Button>
        )}
        <Button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm"
        >
          <FaComment />
          <span>{showComments ? 'Hide Comments' : 'Show Comments'}</span>
        </Button>
        {canManage && (
          <Button
            onClick={() => onEdit?.(announcement)}
            className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-sm"
          >
            <FaEdit />
            <span>Edit</span>
          </Button>
        )}
        {canManage && (
          <Button
            onClick={() => onDelete?.(announcement)}
            className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm"
          >
            <FaTrash />
            <span>Delete</span>
          </Button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t">
          {/* Existing Comments */}
          <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
            {announcement.comments?.map((comment, index) => (
              <div key={index} className="flex items-start space-x-2">
                <FaUserCircle className="text-gray-400 text-xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{comment.user?.name}</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="flex space-x-2">
            <Input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="input-field text-sm flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;
