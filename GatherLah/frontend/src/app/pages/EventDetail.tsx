import { useParams, useNavigate } from "react-router";
import { ArrowLeft, UserPlus, MessageSquare, Share2, Users, Clock, MapPin, Flame, Send } from "lucide-react";
import { mockEvents, mockUsers } from "../data/mockData";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState } from "react";

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chats");
  const [chatMessage, setChatMessage] = useState("");

  const event = mockEvents.find(e => e.id === id);

  if (!event) {
    return (
      <div className="p-4">
        <p>Event not found</p>
      </div>
    );
  }

  const startTime = new Date(event.startTime);
  const attendees = [...event.friendsAttending, ...mockUsers.slice(0, 3)];

  const groupChats = [
    { id: 1, name: "Main Discussion", members: 5, maxMembers: 5, messages: 23 },
    { id: 2, name: "Random Chat", members: 4, maxMembers: 5, messages: 12 },
    { id: 3, name: "Beginner Group", members: 3, maxMembers: 5, messages: 8 },
  ];

  const posts = [
    { user: mockUsers[0], content: "Can't wait to get started! Anyone else excited?", time: "5 mins ago", likes: 3 },
    { user: mockUsers[1], content: "First time joining this type of event. Any tips?", time: "12 mins ago", likes: 5 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate(-1)} className="p-2 -m-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 font-medium truncate">Event Details</h1>
          <button className="p-2 -m-2">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Event Header */}
      <div className="p-4 space-y-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {event.isLive && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                ● LIVE NOW
              </Badge>
            )}
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {event.type}
            </Badge>
          </div>
          <h2 className="text-2xl mb-2">{event.title}</h2>
          <p className="text-gray-600">{event.description}</p>
        </div>

        {/* Event Meta */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>{startTime.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Users className="w-5 h-5 text-gray-400" />
            <span>{event.participants}/{event.maxParticipants} joined</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="capitalize">{event.location}</span>
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-3xl">{event.host.avatar}</span>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Hosted by</p>
            <p className="font-medium">{event.host.name}</p>
          </div>
          <Button size="sm" variant="outline">
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Friends Attending */}
        {event.friendsAttending.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-900">
                👥 {event.friendsAttending.length} friends attending
              </span>
            </div>
            <div className="flex -space-x-2">
              {event.friendsAttending.slice(0, 5).map((friend) => (
                <div 
                  key={friend.id}
                  className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center text-lg"
                >
                  {friend.avatar}
                </div>
              ))}
              {event.friendsAttending.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                  +{event.friendsAttending.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          className={`w-full h-12 text-base ${
            event.isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {event.isLive ? '🎉 Join Now' : '✓ Joined - View Details'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
          <TabsTrigger value="chats">CHATS</TabsTrigger>
          <TabsTrigger value="posts">POSTS</TabsTrigger>
          <TabsTrigger value="entries">ENTRIES</TabsTrigger>
          <TabsTrigger value="members">MEMBERS</TabsTrigger>
        </TabsList>

        {/* Chats Tab */}
        <TabsContent value="chats" className="p-4 space-y-3 m-0">
          <p className="text-sm text-gray-600 mb-4">
            Join a group chat to connect with other participants
          </p>
          {groupChats.map((chat) => (
            <Card key={chat.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium">{chat.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {chat.messages} messages
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {chat.members}/{chat.maxMembers}
                  </Badge>
                  <p className="text-xs text-gray-500">members</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant={chat.members === chat.maxMembers ? "outline" : "default"}
                disabled={chat.members === chat.maxMembers}
              >
                {chat.members === chat.maxMembers ? 'Full' : 'Join Chat'}
              </Button>
            </Card>
          ))}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="m-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Share your thoughts..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-full"
              />
              <Button className="rounded-full w-12 h-12 p-0">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {posts.map((post, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-3 mb-3">
                  <span className="text-2xl">{post.user.avatar}</span>
                  <div className="flex-1">
                    <p className="font-medium">{post.user.name}</p>
                    <p className="text-xs text-gray-500">{post.time}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <button className="flex items-center gap-1">
                    ❤️ {post.likes}
                  </button>
                  <button>Reply</button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="p-4 m-0">
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No entries yet</p>
            <p className="text-sm">Share your work when the event starts!</p>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="p-4 space-y-2 m-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">All Members ({attendees.length})</h3>
            <button className="text-sm text-blue-600">Filter</button>
          </div>
          {attendees.map((user) => (
            <Card key={user.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-2xl">{user.avatar}</span>
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    {user.isFriend && (
                      <Badge variant="outline" className="text-xs">Friend</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                {!user.isFriend && (
                  <Button size="sm" variant="outline">
                    Add
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
