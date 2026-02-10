import { useState } from "react";
import { Search, UserPlus, QrCode, Share2, Star, MessageSquare, Video, MoreVertical, Users, UserCheck, UserX } from "lucide-react";
import { mockUsers, friendRequests } from "../data/mockData";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export function Friends() {
  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const friends = mockUsers.filter(u => u.isFriend);
  const following = mockUsers.filter(u => u.isFollowing && !u.isFriend);
  const followers = mockUsers.filter(u => u.isFollower && !u.isFriend);
  const closeFriends = friends.filter(u => u.isCloseFriend);
  const onlineNow = friends.filter(u => u.isOnline);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-4">
        <h1 className="text-xl mb-2">Friends</h1>
        <div className="flex gap-3 text-xs text-gray-600">
          <span><span className="font-medium text-gray-900">{friends.length}</span> Friends</span>
          <span><span className="font-medium text-gray-900">{following.length}</span> Following</span>
          <span><span className="font-medium text-gray-900">{followers.length}</span> Followers</span>
          <span><span className="font-medium text-green-600">{onlineNow.length} 🟢</span> Online</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" size="sm" className="flex flex-col h-auto py-2">
          <UserPlus className="w-4 h-4 mb-1" />
          <span className="text-xs">Add</span>
        </Button>
        <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 relative">
          <UserCheck className="w-4 h-4 mb-1" />
          <span className="text-xs">Requests</span>
          {friendRequests.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-xs">
              {friendRequests.length}
            </Badge>
          )}
        </Button>
        <Button variant="outline" size="sm" className="flex flex-col h-auto py-2">
          <QrCode className="w-4 h-4 mb-1" />
          <span className="text-xs">Scan QR</span>
        </Button>
        <Button variant="outline" size="sm" className="flex flex-col h-auto py-2">
          <Share2 className="w-4 h-4 mb-1" />
          <span className="text-xs">Share</span>
        </Button>
      </div>

        {/* Search */}
        <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
        />
      </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 rounded-none sticky top-[88px] z-10">
            <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
            <TabsTrigger value="following" className="text-xs">Following</TabsTrigger>
            <TabsTrigger value="followers" className="text-xs">Followers</TabsTrigger>
            <TabsTrigger value="discover" className="text-xs">Discover</TabsTrigger>
            <TabsTrigger value="requests" className="relative text-xs">
              Requests
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-4 px-4 mt-4 m-0">
          {/* Close Friends Section */}
          {closeFriends.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <h3 className="font-medium">Close Friends</h3>
                <Badge variant="outline" className="text-xs">{closeFriends.length}</Badge>
              </div>
              <div className="space-y-2">
                {closeFriends.map((user) => (
                  <FriendCard key={user.id} user={user} isCloseFriend />
                ))}
              </div>
            </div>
          )}

          {/* All Friends */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">All Friends ({friends.length})</h3>
              <select className="text-sm border border-gray-200 rounded px-2 py-1">
                <option>Recently Active</option>
                <option>Alphabetical</option>
                <option>Most Interactions</option>
              </select>
            </div>
            <div className="space-y-2">
              {friends.map((user) => (
                <FriendCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="space-y-2 px-4 mt-4 m-0">
          {following.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>You're not following anyone yet</p>
              <p className="text-sm mt-1">Discover interesting people in the Discover tab</p>
            </Card>
          ) : (
            following.map((user) => (
              <UserCard key={user.id} user={user} actionType="following" />
            ))
          )}
        </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers" className="space-y-2 px-4 mt-4 m-0">
          {followers.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No followers yet</p>
              <p className="text-sm mt-1">Share your profile to get followers</p>
            </Card>
          ) : (
            followers.map((user) => (
              <UserCard key={user.id} user={user} actionType="follower" />
            ))
          )}
        </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-4 px-4 mt-4 m-0">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50">
            <h3 className="font-medium mb-2">Suggested for You</h3>
            <p className="text-sm text-gray-600 mb-3">Based on your interests and activity</p>
            <div className="space-y-2">
              {mockUsers.slice(3, 6).map((user) => (
                <UserCard key={user.id} user={user} actionType="discover" />
              ))}
            </div>
          </Card>

          <div>
            <h3 className="font-medium mb-3">People from Recent Events</h3>
            <div className="space-y-2">
              {mockUsers.slice(0, 2).map((user) => (
                <Card key={user.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{user.avatar}</span>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <p className="text-xs text-blue-600 mt-1">Met at Drawing Challenge</p>
                    </div>
                    <Button size="sm">Add Friend</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4 px-4 mt-4 m-0">
          <div>
            <h3 className="font-medium mb-3">Incoming Requests ({friendRequests.length})</h3>
            <div className="space-y-2">
              {friendRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{request.user.avatar}</span>
                    <div className="flex-1">
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-sm text-gray-600">@{request.user.username}</p>
                      {request.context && (
                        <p className="text-xs text-blue-600 mt-1">{request.context}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{request.sentAt}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm">Accept</Button>
                        <Button size="sm" variant="outline">Decline</Button>
                        <Button size="sm" variant="ghost">View Profile</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FriendCard({ user, isCloseFriend }: { user: any; isCloseFriend?: boolean }) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div className="relative">
          <span className="text-3xl">{user.avatar}</span>
          {user.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.name}</p>
            {isCloseFriend && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
            {user.mood && <span className="text-sm">{user.mood}</span>}
          </div>
          <p className="text-sm text-gray-600">@{user.username}</p>
          <p className="text-xs text-gray-500 mt-1">
            {user.currentActivity || user.lastSeen}
          </p>
          {user.friendsSince && (
            <p className="text-xs text-gray-500">
              Friends for {user.friendsSince} • {user.mutualFriends} mutual friends
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Video className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function UserCard({ user, actionType }: { user: any; actionType: 'following' | 'follower' | 'discover' }) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{user.avatar}</span>
        <div className="flex-1">
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-600">@{user.username}</p>
          <p className="text-sm text-gray-700 mt-1">{user.bio}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {user.interests.slice(0, 3).map((interest: string) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {actionType === 'following' && (
            <>
              <Button size="sm" variant="outline">Following ✓</Button>
              <Button size="sm" variant="outline">Add Friend</Button>
            </>
          )}
          {actionType === 'follower' && (
            <>
              <Button size="sm">Follow Back</Button>
              <Button size="sm" variant="outline">Add Friend</Button>
            </>
          )}
          {actionType === 'discover' && (
            <>
              <Button size="sm">Follow</Button>
              <Button size="sm" variant="outline">Add Friend</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
