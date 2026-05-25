function ctaskStateClass(state) {
  const key = (state || 'open').toLowerCase();
  return `state-pill state-ctask-${key}`;
}

export default function ChangeTasksTable({ ctasks, loading }) {
  if (loading) {
    return <p className="cr-table-hint">Loading change tasks…</p>;
  }

  if (!ctasks?.length) {
    return (
      <p className="cr-table-hint">No change tasks (CTASK) for this change request.</p>
    );
  }

  return (
    <div className="cr-table-wrap ctask-table-wrap">
      <table className="cr-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Task type</th>
            <th>Location</th>
            <th>Short description</th>
            <th>State</th>
            <th>Assignment group</th>
            <th>Assigned to</th>
            <th>Planned start</th>
            <th>Planned end</th>
          </tr>
        </thead>
        <tbody>
          {ctasks.map((task) => (
            <tr key={task.number}>
              <td>
                <strong>{task.number}</strong>
              </td>
              <td>{task.taskType}</td>
              <td className="cr-title-cell">{task.location}</td>
              <td className="cr-title-cell">{task.shortDescription}</td>
              <td>
                <span className={ctaskStateClass(task.state)}>{task.state}</span>
              </td>
              <td className="mono-cell">{task.assignmentGroup}</td>
              <td>{task.assignedTo}</td>
              <td className="mono-cell">{task.plannedStartDate}</td>
              <td className="mono-cell">{task.plannedEndDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
