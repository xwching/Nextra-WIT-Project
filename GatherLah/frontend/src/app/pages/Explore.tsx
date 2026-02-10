import { useState } from "react";
import { Search, TrendingUp, Award, Lightbulb, Shuffle, Heart } from "lucide-react";
import { mockUsers, mockEvents } from "../data/mockData";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function Explore() {
  const [searchQuery, setSearchQuery] = useState("");

  const suggestedPeople = mockUsers.slice(0, 4);
  const trendingTopics = [
    { name: "Art & Drawing", count: 24, emoji: "🎨" },
    { name: "Hackathons", count: 18, emoji: "💻" },
    { name: "Book Clubs", count: 15, emoji: "📚" },
    { name: "Gaming", count: 12, emoji: "🎮" },
    { name: "Wellness", count: 10, emoji: "🧘" },
  ];

  const communityLeaders = [
    { user: mockUsers[0], score: 1250, badge: "🏆 Top Contributor" },
    { user: mockUsers[1], score: 980, badge: "⭐ Event Master" },
    { user: mockUsers[2], score: 875, badge: "💬 Community Hero" },
  ];

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl mb-1">Explore</h1>
        <p className="text-sm text-gray-600">Discover communities & experiences</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search events, users, interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-base"
        />
      </div>

      {/* Trending Topics */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="font-medium">Trending Topics</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {trendingTopics.map((topic) => (
            <Card 
              key={topic.name} 
              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{topic.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{topic.name}</p>
                  <p className="text-xs text-gray-500">{topic.count} events</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* People Discovery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium">Suggested Connections</h3>
          </div>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Shuffle className="w-4 h-4" />
            Surprise me
          </Button>
        </div>
        <div className="space-y-3">
          {suggestedPeople.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex gap-3">
                <span className="text-3xl">{user.avatar}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{user.name}</p>
                    <Button size="sm">Follow</Button>
                  </div>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                  <p className="text-sm text-gray-700 mt-1">{user.bio}</p>
                  
                  {/* Connection Context */}
                  <div className="mt-2 space-y-1">
                    {user.mutualFriends && (
                      <p className="text-xs text-blue-600">
                        {user.mutualFriends} mutual friends
                      </p>
                    )}
                    {user.eventsAttended && (
                      <p className="text-xs text-gray-500">
                        You both attended {user.eventsAttended} similar events
                      </p>
                    )}
                  </div>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.interests.slice(0, 3).map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Community Leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium">Community Leaders</h3>
        </div>
        <Card className="divide-y">
          {communityLeaders.map((leader, index) => (
            <div key={leader.user.id} className="p-4 flex items-center gap-3">
              <div className="text-xl font-medium w-6 text-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
              <span className="text-2xl">{leader.user.avatar}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{leader.user.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {leader.badge}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{leader.score} impact points</p>
              </div>
              <Button size="sm" variant="outline">View Profile</Button>
            </div>
          ))}
        </Card>
        <div className="text-center mt-3">
          <Button variant="outline" size="sm">View Full Leaderboard</Button>
        </div>
      </div>

      {/* Active Communities */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-red-600" />
          <h3 className="font-medium">Active Communities</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎨</div>
              <div className="flex-1">
                <h3 className="font-medium">Creative Corner</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Artists, designers, and creative minds sharing inspiration
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>247 members</span>
                  <span>•</span>
                  <span>18 events this week</span>
                </div>
                <Button size="sm" className="mt-3">Join Community</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💻</div>
              <div className="flex-1">
                <h3 className="font-medium">Tech Builders</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Developers building cool stuff together
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>312 members</span>
                  <span>•</span>
                  <span>12 events this week</span>
                </div>
                <Button size="sm" className="mt-3">Join Community</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📚</div>
              <div className="flex-1">
                <h3 className="font-medium">Book Lovers</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monthly book clubs and reading discussions
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>189 members</span>
                  <span>•</span>
                  <span>6 events this week</span>
                </div>
                <Button size="sm" className="mt-3">Join Community</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Random Discovery */}
      <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 text-center">
        <Shuffle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
        <h3 className="font-medium mb-1">Feeling Adventurous?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Discover random people and events outside your usual interests
        </p>
        <Button className="bg-orange-600 hover:bg-orange-700">
          Surprise Me!
        </Button>
      </Card>
    </div>
  );
}
