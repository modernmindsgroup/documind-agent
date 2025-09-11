import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  Bot, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Users,
  Globe,
  Shield
} from 'lucide-react';

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const features = [
    {
      icon: Bot,
      title: "Smart AI Agents",
      description: "Create and deploy intelligent voice and chat agents that understand context and deliver natural conversations."
    },
    {
      icon: Zap,
      title: "Workflow Automation", 
      description: "Build complex conversation flows with visual drag-and-drop interface. No coding required."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Track performance, analyze conversations, and optimize your agents with detailed insights."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with multi-tenant architecture and role-based access controls."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Agents" },
    { number: "2M+", label: "Conversations" },
    { number: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Platform Introduction - Exactly 50% */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex-col justify-center relative overflow-hidden">
        {/* Modern Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 px-16 py-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">AI Agent Dashboard</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">Intelligent Conversation Platform</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
              Build Powerful AI Agents That Actually
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Understand</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-md">
              Create, deploy, and manage intelligent voice and chat agents that deliver exceptional customer experiences. 
              No technical expertise required.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.number}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-5 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:shadow-md transition-all duration-200">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-lg">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" />
                <span>10,000+ Companies</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Globe className="h-4 w-4" />
                <span>50+ Languages</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form - Exactly 50% */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-full max-w-md px-8 py-16">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center space-y-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">AI Agent Dashboard</span>
            </div>
          </div>
          
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-3 text-center lg:text-left px-0">
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">Sign in</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
                Enter your email and password to access your dashboard
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 px-0">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium text-base">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="input-email"
                    className="h-12 text-base border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium text-base">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    data-testid="input-password"
                    className="h-12 text-base border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-6 px-0">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200" 
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <div className="text-center text-slate-600 dark:text-slate-400">
                  Don't have an account?{' '}
                  <Link 
                    href="/register" 
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                    data-testid="link-register"
                  >
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Additional Info for Mobile */}
          <div className="lg:hidden mt-12 space-y-8">
            <div className="flex justify-center gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.number}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Secure
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4" />
                Global
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Trusted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}