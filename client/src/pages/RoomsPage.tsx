import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Video, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Calendar,
  PlayCircle,
  StopCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  tenantId: string;
  createdByAgentId?: string;
  status: 'active' | 'ended';
  createdAt: string;
}

function RoomsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState("");

  // Fetch rooms from API
  const { data: roomsData, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      return response.json();
    },
  });

  const rooms = roomsData?.rooms || [];

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room created",
        description: "The room has been created successfully and is ready for use.",
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setIsCreateDialogOpen(false);
      setRoomName("");
    },
    onError: () => {
      toast({
        title: "Create failed",
        description: "Failed to create the room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await fetch(`/api/rooms/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ name: data.name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room updated",
        description: "The room has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setEditingRoom(null);
      setRoomName("");
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update the room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete room');
      }
    },
    onSuccess: () => {
      toast({
        title: "Room deleted",
        description: "The room has been deleted and all participants disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setDeletingRoom(null);
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      createRoomMutation.mutate({ name: roomName.trim() });
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom && roomName.trim()) {
      updateRoomMutation.mutate({ id: editingRoom.id, name: roomName.trim() });
    }
  };

  const isDialogOpen = isCreateDialogOpen || editingRoom !== null;
  const isLoading_ = createRoomMutation.isPending || updateRoomMutation.isPending;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load rooms</h3>
              <p className="text-sm text-muted-foreground">
                There was an error loading your rooms. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Rooms</h1>
          <p className="text-muted-foreground">
            Create and manage communication rooms for real-time voice and video calls
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-room">
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room: Room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-none">{room.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {new Date(room.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid={`button-room-menu-${room.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(room)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Room
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setDeletingRoom(room)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={room.status === 'active' ? 'default' : 'secondary'}
                    className={cn(
                      room.status === 'active' && "bg-green-100 text-green-800 hover:bg-green-200"
                    )}
                  >
                    {room.status === 'active' ? (
                      <PlayCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <StopCircle className="h-3 w-3 mr-1" />
                    )}
                    {room.status === 'active' ? 'Active' : 'Ended'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>0 participants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Video className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No rooms found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Get started by creating your first communication room for real-time voice and video calls.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-room">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Room
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Room Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingRoom(null);
            setRoomName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Edit Room' : 'Create New Room'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingRoom ? handleUpdateSubmit : handleCreateSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Enter room name..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  disabled={isLoading_}
                  data-testid="input-room-name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingRoom(null);
                  setRoomName("");
                }}
                disabled={isLoading_}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading_ || !roomName.trim()} data-testid="button-save-room">
                {isLoading_ ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {editingRoom ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingRoom ? 'Update Room' : 'Create Room'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingRoom !== null} onOpenChange={() => setDeletingRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingRoom?.name}"? This will permanently remove the room 
              and disconnect all current participants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRoomMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRoom && deleteRoomMutation.mutate(deletingRoom.id)}
              disabled={deleteRoomMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRoomMutation.isPending ? 'Deleting...' : 'Delete Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RoomsPage;