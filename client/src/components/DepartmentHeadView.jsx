import { FaUserTie, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const DepartmentHeadView = ({ departments }) => {
  const deptHeads = departments
    .filter(dept => dept.headOfDepartment)
    .map(dept => ({
      ...dept.headOfDepartment,
      department: dept.name,
      departmentId: dept._id
    }));

  if (deptHeads.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FaUserTie className="mr-2 text-primary-600" />
        Department Heads
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptHeads.map((head, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <FaUserTie className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{head.name}</p>
              <p className="text-sm text-gray-500">{head.department}</p>
            </div>
            <Link 
              to={`/departments/${head.departmentId}`}
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentHeadView;