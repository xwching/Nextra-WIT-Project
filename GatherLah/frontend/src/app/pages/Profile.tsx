import { useState } from "react";
import { Share2, QrCode, Settings, Trophy, Flame, Calendar, Users, TrendingUp, Star, Edit2, MapPin } from "lucide-react";
import { currentUser, badges } from "../data/mockData";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export function Profile() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = {
    friends: 47,
    following: 89,
    followers: 112,
    streak: 7,
    eventsJoined: 24,
    eventsHosted: 5,
    impactPoints: 856,
    connectionsMade: 24,
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl">
              {currentUser.avatar}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
              <Edit2 className="w-3 h-3 text-gray-600" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-xl font-medium">{currentUser.name}</h1>
                <p className="text-sm text-gray-600">@{currentUser.username}</p>
              </div>
              <Button size="sm" variant="outline">
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            <p className="text-sm text-gray-700 mb-3">{currentUser.bio}</p>
            
            {/* Status Indicators */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <span className="mr-1">●</span> Online
              </Badge>
              <Badge variant="outline">{currentUser.mood} Feeling great</Badge>
              <Badge variant="outline" className="bg-yellow-50">
                ⚡ {currentUser.energyLevel} energy
              </Badge>
            </div>

            {/* Social Stats */}
            <div className="flex gap-4 text-sm">
              <button className="hover:underline">
                <span className="font-medium">{stats.friends}</span>{" "}
                <span className="text-gray-600">Friends</span>
              </button>
              <button className="hover:underline">
                <span className="font-medium">{stats.following}</span>{" "}
                <span className="text-gray-600">Following</span>
              </button>
              <button className="hover:underline">
                <span className="font-medium">{stats.followers}</span>{" "}
                <span className="text-gray-600">Followers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-1" />
            Share Profile
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <QrCode className="w-4 h-4 mr-1" />
            QR Code
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
        </div>
      </Card>

      {/* Streak & Impact */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔥</div>
            <div>
              <p className="text-sm text-gray-600">Streak</p>
              <p className="text-xl font-medium">{stats.streak} days</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⭐</div>
            <div>
              <p className="text-sm text-gray-600">Impact Points</p>
              <p className="text-xl font-medium">{stats.impactPoints}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Activity Stats */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">This Month</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-medium">{stats.eventsJoined}</p>
                  <p className="text-xs text-gray-600">Events Joined</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-medium">{stats.eventsHosted}</p>
                  <p className="text-xs text-gray-600">Events Hosted</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-medium">{stats.connectionsMade}</p>
                  <p className="text-xs text-gray-600">Connections Made</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-medium">+12%</p>
                  <p className="text-xs text-gray-600">Growth</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Badges */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Recent Achievements</h3>
            <div className="space-y-2">
              {badges.slice(0, 3).map((badge) => (
                <div key={badge.name} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              View All Badges
            </Button>
          </Card>

          {/* Your Impact */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <h3 className="font-medium mb-2">Your Impact</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-gray-600">People you've helped</span>
                <span className="font-medium">24</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-600">Made their day</span>
                <span className="font-medium">3 times 💚</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-600">Events created</span>
                <span className="font-medium">5</span>
              </p>
            </div>
          </Card>

          {/* Member Since */}
          <Card className="p-4">
            <p className="text-sm text-gray-600 text-center">
              Member since {new Date(currentUser.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <Card key={badge.name} className="p-4 text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-medium text-sm">{badge.name}</p>
                <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="font-medium mb-3">All Time Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-gray-600">Total Events</span>
                <span className="font-medium">29</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-gray-600">Events Hosted</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-gray-600">Connections Made</span>
                <span className="font-medium">47</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-gray-600">Total Impact Points</span>
                <span className="font-medium">856</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-gray-600">Longest Streak</span>
                <span className="font-medium">12 days 🔥</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Badges Earned</span>
                <span className="font-medium">{badges.length}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-3 mt-4">
          <Card className="p-4">
            <h3 className="font-medium mb-3">Privacy Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Profile Visibility</span>
                <select className="text-sm border border-gray-200 rounded px-2 py-1">
                  <option>Public</option>
                  <option>Friends Only</option>
                  <option>Private</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Who can send friend requests</span>
                <select className="text-sm border border-gray-200 rounded px-2 py-1">
                  <option>Everyone</option>
                  <option>Followers</option>
                  <option>No one</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show online status</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show activity</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Friend requests</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Event reminders</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Friend activity</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Badges & achievements</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-3">Account</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:text-red-700">
                Delete Account
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
