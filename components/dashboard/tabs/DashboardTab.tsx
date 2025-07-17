import React, { useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { formatDate, getEmployeeName } from '../../../lib/utils';
import { Users, ListChecks, CheckCircle, Clock } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import { Task } from '../../../types';
import Calendar, { CalendarEvent } from '../Calendar';

interface DashboardTabProps {
  setActiveTab: (tab: string) => void;
}

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string; }> = ({ icon: Icon, title, value, color }) => (
  <Card className={`relative overflow-hidden border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  </Card>
);

const DashboardTab: React.FC<DashboardTabProps> = ({ setActiveTab }) => {
  const { employees, tasks, financeData } = useData();

  const stats = useMemo(() => ({
    employees: employees.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'Concluída').length,
    pendingTasks: tasks.filter(task => task.status !== 'Concluída').length,
  }), [employees, tasks]);

  const recentTasks = useMemo(() => 
    [...tasks]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  , [tasks]);

  const calendarEvents = useMemo(() => {
    const contractEvents: CalendarEvent[] = financeData.map(item => ({
      date: item.contractEndDate,
      color: 'red',
      title: `Vencimento Contrato: ${item.municipality}`
    }));

    const taskEvents: CalendarEvent[] = tasks.map(task => ({
      date: task.date,
      color: 'blue',
      title: `Tarefa: ${task.title}`
    }));

    return [...contractEvents, ...taskEvents];
  }, [financeData, tasks]);

  const columns: Column<Task>[] = [
      {
        key: 'employee',
        header: 'Funcionário',
        render: (task) => getEmployeeName(task.employeeId, employees),
        className: 'font-medium text-gray-900 whitespace-nowrap'
      },
      { key: 'title', header: 'Tarefa' },
      { key: 'date', header: 'Data', render: (task) => formatDate(task.date) },
      { key: 'status', header: 'Status', render: (task) => <Badge status={task.status} /> },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: () => (
          <Button variant="secondary" size="sm" onClick={() => setActiveTab('tasks')}>
            Ver Tarefas
          </Button>
        ),
      },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Funcionários Ativos" value={stats.employees} color="border-blue-500" />
        <StatCard icon={ListChecks} title="Tarefas Totais" value={stats.totalTasks} color="border-purple-500" />
        <StatCard icon={CheckCircle} title="Tarefas Concluídas" value={stats.completedTasks} color="border-green-500" />
        <StatCard icon={Clock} title="Tarefas Pendentes" value={stats.pendingTasks} color="border-yellow-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
            <Calendar title="Calendário de Vencimento de Contratos" events={calendarEvents} />
        </div>
        <div className="lg:col-span-3">
            <Card>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Tarefas Recentes</h2>
                <DataTable
                    columns={columns}
                    data={recentTasks}
                    emptyMessage="Nenhuma tarefa recente encontrada."
                />
            </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;