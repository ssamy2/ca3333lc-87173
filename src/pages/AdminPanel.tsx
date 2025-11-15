import { Shield, Users, Gift, TrendingUp, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminPanel = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Users', value: '---', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Gifts', value: '---', icon: Gift, color: 'from-purple-500 to-pink-500' },
    { label: 'Total Searches', value: '---', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'System Status', value: 'Active', icon: Settings, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">System Management Dashboard</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="rounded-xl"
          >
            Back to App
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl border border-border/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Settings className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              This is the admin panel placeholder. Admin features will be implemented here.
            </p>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Recent Users
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <span className="text-sm text-muted-foreground">No data available</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <span className="text-sm text-muted-foreground">No activity data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
