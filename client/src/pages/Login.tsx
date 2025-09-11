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
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Platform Introduction */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex-col justify-center px-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 max-w-lg mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">AI Agent Dashboard</span>
              <span className="text-sm text-muted-foreground">Intelligent Conversation Platform</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
              Build Powerful AI Agents That Actually
              <span className="text-primary"> Understand</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Create, deploy, and manage intelligent voice and chat agents that deliver exceptional customer experiences. 
              No technical expertise required.
            </p>

            {/* Stats */}
            <div className="flex gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 group hover:bg-background/50 p-4 rounded-lg transition-all duration-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ Companies</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>50+ Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AI Agent Dashboard</span>
            </div>
          </div>
          
          <Card className="w-full border-0 lg:border lg:shadow-xl lg:bg-card/50 lg:backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center lg:text-left">
              <CardTitle className="text-2xl font-bold text-foreground">Sign in</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your email and password to access your dashboard
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="input-email"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    data-testid="input-password"
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium" 
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    href="/register" 
                    className="text-primary hover:underline font-medium transition-colors"
                    data-testid="link-register"
                  >
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Additional Info for Mobile */}
          <div className="lg:hidden text-center space-y-4">
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="font-semibold text-primary">{stat.number}</div>
                  <div>{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Global
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Trusted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}