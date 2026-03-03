import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  FaUpload,
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileArchive,
  FaDownload,
  FaTrash,
  FaShare,
  FaFilter,
  FaSearch,
  FaEye,
  FaHistory,
  FaChartBar,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import UploadFileModal from "../components/modals/UploadFileModal";
import FilePreviewModal from "../components/modals/FilePreviewModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FileManagement = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
    type: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchFiles();
    if (isAdmin) {
      fetchStats();
    }
  }, [filters, pagination.page]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(filters.category !== "all" && { category: filters.category }),
        ...(filters.type !== "all" && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await axios.get(`${API_URL}/files?${params}`);
      setFiles(response.data.data);
      setCategories(response.data.categories || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/files/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(
        `${API_URL}/files/${file._id}/download`,
        {
          responseType: "blob",
        },
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Download started");
    } catch (error) {
      toast.error(error, "Failed to download file");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await axios.delete(`${API_URL}/files/${id}`);
      toast.success("File deleted successfully");
      fetchFiles();
      if (isAdmin) fetchStats();
    } catch (error) {
      toast.error(error, "Failed to delete file");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes("pdf")) return <FaFilePdf className="text-red-500" />;
    if (fileType.includes("word"))
      return <FaFileWord className="text-blue-500" />;
    if (fileType.includes("sheet") || fileType.includes("excel"))
      return <FaFileExcel className="text-green-500" />;
    if (fileType.includes("image"))
      return <FaFileImage className="text-purple-500" />;
    if (fileType.includes("zip") || fileType.includes("rar"))
      return <FaFileArchive className="text-yellow-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Management</h1>
          <p className="text-gray-600 mt-1">
            Upload, organize, and share files
          </p>
        </div>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FaUpload />
            <span>Upload File</span>
          </button>
        )}
      </div>

      {/* Stats Cards (Admin only) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Total Files</p>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.summary.totalFiles}
                </p>
              </div>
              <FaFile className="text-blue-500 text-3xl" />
            </div>
          </div>

          <div className="card bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Total Size</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatFileSize(stats.summary.totalSize)}
                </p>
              </div>
              <FaChartBar className="text-green-500 text-3xl" />
            </div>
          </div>

          <div className="card bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Downloads</p>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.summary.totalDownloads}
                </p>
              </div>
              <FaDownload className="text-purple-500 text-3xl" />
            </div>
          </div>

          <div className="card bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm">Views</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {stats.summary.totalViews}
                </p>
              </div>
              <FaEye className="text-yellow-500 text-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">File Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="spreadsheet">Spreadsheets</option>
            </select>
          </div>

          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search files..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file._id}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(file.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-gray-900 truncate"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.fileSize)} •{" "}
                    {formatDistanceToNow(new Date(file.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags/Category */}
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">
                {file.category}
              </span>
              {file.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Description */}
            {file.description && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {file.description}
              </p>
            )}

            {/* Uploader Info */}
            <div className="flex items-center text-xs text-gray-500 mb-3">
              <span>Uploaded by {file.uploadedBy?.name}</span>
              {file.department && (
                <>
                  <span className="mx-1">•</span>
                  <span>{file.department}</span>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span className="flex items-center">
                <FaDownload className="mr-1" /> {file.downloadCount || 0}
              </span>
              <span className="flex items-center">
                <FaEye className="mr-1" /> {file.viewCount || 0}
              </span>
              {file.version > 1 && (
                <span className="flex items-center">
                  <FaHistory className="mr-1" /> v{file.version}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => {
                  setSelectedFile(file);
                  setShowPreviewModal(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Preview"
              >
                <FaEye />
              </button>
              <button
                onClick={() => handleDownload(file)}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Download"
              >
                <FaDownload />
              </button>
              {(isAdmin || file.uploadedBy?._id === user?._id) && (
                <>
                  <button
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                    title="Share"
                  >
                    <FaShare />
                  </button>
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadFileModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchFiles();
            if (isAdmin) fetchStats();
            setShowUploadModal(false);
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedFile(null);
          }}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default FileManagement;
