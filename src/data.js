export const PROFILE = {
  handle: "@inside_my_backpack",
  base: "HSR Layout, Bangalore",
  gear: ["Sony A7III", "DJI Mini 5 Pro", "iPhone 15 Pro Max"],
  budget: "₹10,000/month",
  lifestyle: ["Weekend driver", "Home cook", "Full-time job", "Café explorer"],
  buckets: ["City Life & Cafés","Road Trips","Weekend Getaways","Food & Cooking","Men's Style","Working Pro + Travel"],
};

export const FORMATS = {
  Reel:          { icon:"🎬", color:"#F59E0B" },
  Carousel:      { icon:"🎠", color:"#3B82F6" },
  "Talking Head":{ icon:"🎙️", color:"#8B5CF6" },
  Story:         { icon:"📱", color:"#22C55E" },
  Vlog:          { icon:"📹", color:"#14B8A6" },
};

export const BUCKET_COLORS = {
  "City Life & Cafés":   "#14B8A6",
  "Road Trips":          "#F59E0B",
  "Weekend Getaways":    "#3B82F6",
  "Food & Cooking":      "#EF4444",
  "Men's Style":         "#8B5CF6",
  "Working Pro + Travel":"#22C55E",
};

export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function makeSeedCalendar() {
  const start = new Date(2026, 4, 27);
  const seeds = [
    { format:"Reel",          bucket:"City Life & Cafés",    title:"A Day Off in HSR — My Favourite Spots",             hook:"It's Saturday, I live in HSR Layout, and I have nowhere to be.",     postTime:"7:30 AM", ready:true },
    { format:"Carousel",      bucket:"Men's Style",           title:"My Travel Outfit Formula (Works Every Time)",       hook:"I've worn this formula on every trip for 2 years.",                  postTime:"8:00 AM", ready:true },
    { format:"Talking Head",  bucket:"Working Pro + Travel",  title:"Full Time Job + Content Creator — How I Manage It", hook:"I work full-time. Don't travel every week. Still post consistently.", postTime:"7:30 AM", ready:true },
    { format:"Vlog",          bucket:"Road Trips",            title:"Solo Drive: Bangalore to Savandurga — 55km",        hook:"55km from HSR Layout. No plan. Just filled up the tank and drove.",  postTime:"8:00 AM", ready:true },
    { format:"Reel",          bucket:"Food & Cooking",        title:"I Made This at 9PM on a Wednesday",                 hook:"Wednesday night. Nothing in the fridge. This is what happened.",    postTime:"7:00 AM", ready:true },
    { format:"Reel",          bucket:"Road Trips",            title:"Left HSR at 6AM. No Plan. Here's Where I Ended Up.",hook:"Full tank, no destination. 3 hours later — this.",                   postTime:"7:30 AM" },
    { format:"Carousel",      bucket:"City Life & Cafés",     title:"5 Cafés in HSR/Koramangala Worth Filming In",       hook:"Not just good coffee — genuinely good for content.",                 postTime:"8:00 AM" },
    { format:"Story",         bucket:"Men's Style",           title:"Rate My Road Trip OOTD — You Pick",                 hook:"Heading out this weekend. Which outfit?",                           postTime:"9:00 AM" },
    { format:"Talking Head",  bucket:"Road Trips",            title:"What I Keep in My Car for Content Creation",        hook:"My car is basically a mobile production studio.",                   postTime:"7:30 AM" },
    { format:"Reel",          bucket:"Food & Cooking",        title:"Recreating a Café Dish at Home",                    hook:"Paid ₹450 at a café. Made it at home for ₹90.",                     postTime:"7:00 AM" },
    { format:"Reel",          bucket:"Weekend Getaways",      title:"Drove 60km at 4:30 AM for THIS View — Nandi Hills", hook:"Alarm: 3:45 AM. Car loaded. Destination: Nandi Hills.",             postTime:"7:00 AM" },
    { format:"Carousel",      bucket:"Weekend Getaways",      title:"Nandi Hills: Complete Guide from HSR Layout",       hook:"Everything you need — from someone who drove at 4:30 AM.",          postTime:"8:00 AM" },
    { format:"Vlog",          bucket:"Weekend Getaways",      title:"Solo Sunrise Vlog — Nandi Hills from Bangalore",    hook:"3:45 alarm. Solo drive. Drone at sunrise. The full thing.",          postTime:"8:00 AM" },
    { format:"Carousel",      bucket:"Men's Style",           title:"5 Outfits for Weekend Drives in Bangalore",         hook:"You don't need much. But you need the right fit.",                  postTime:"8:00 AM" },
    { format:"Story",         bucket:"Food & Cooking",        title:"What Should I Cook This Weekend? (Poll)",           hook:"I'm cooking Sunday. You're picking the dish.",                      postTime:"9:00 AM" },
    { format:"Reel",          bucket:"Road Trips",            title:"Bangalore to Mysore in 3 Hours — Road Trip Reel",   hook:"Friday 6PM. Left HSR. 3 hours later — Mysore Palace lit up.",       postTime:"7:30 AM" },
    { format:"Vlog",          bucket:"Weekend Getaways",      title:"Mysore in 36 Hours — The Honest Weekend Guide",     hook:"I gave Mysore a weekend. Everything I did, ate, filmed.",           postTime:"8:00 AM" },
    { format:"Talking Head",  bucket:"Working Pro + Travel",  title:"Why I Travel Alone Even When I Don't Have To",      hook:"I have friends. Could get a group. I still go alone.",              postTime:"7:30 AM" },
    { format:"Reel",          bucket:"Food & Cooking",        title:"Sunday Cook — Full Meal, Zero Delivery",            hook:"It's Sunday. No plans. Just me, the kitchen, and the A7III.",      postTime:"7:00 AM" },
    { format:"Carousel",      bucket:"Road Trips",            title:"5 Best Drives from Bangalore (Under 3 Hours)",      hook:"I've driven all of these from HSR Layout. Real ranking.",           postTime:"8:00 AM" },
    { format:"Reel",          bucket:"Weekend Getaways",      title:"The Waterfall 130km from Bangalore Nobody Talks About", hook:"Nandi Hills. Mysore. But this one surprised me most.",          postTime:"7:00 AM" },
    { format:"Carousel",      bucket:"Men's Style",           title:"Men's Packing Formula: 10 Items, 30 Outfits",       hook:"Pack light. Look good. Here's the exact formula.",                 postTime:"8:00 AM" },
    { format:"Story",         bucket:"City Life & Cafés",     title:"This or That: Bangalore Café Edition",              hook:"Two cafés. Same vibe. Which would you pick?",                      postTime:"9:00 AM" },
    { format:"Talking Head",  bucket:"Working Pro + Travel",  title:"How I Plan a Weekend Trip in 20 Minutes",           hook:"I never plan in advance. Here's how I make it work.",              postTime:"7:30 AM" },
    { format:"Vlog",          bucket:"City Life & Cafés",     title:"A Bangalore City Drive — No Destination, Just Vibes",hook:"Sunday evening. No destination. Just the car and a camera.",       postTime:"8:00 AM" },
    { format:"Reel",          bucket:"Food & Cooking",        title:"The One Dish I Make Every Single Week",             hook:"I've cooked this at least 50 times. Never gets old.",              postTime:"7:00 AM" },
    { format:"Carousel",      bucket:"Weekend Getaways",      title:"Chikmagalur: Is It Worth the 4.5 Hour Drive?",      hook:"245km from HSR Layout. Here's the honest answer.",                 postTime:"8:00 AM" },
    { format:"Talking Head",  bucket:"Men's Style",           title:"How I Dress When I'm Not Trying (But Look Good)",   hook:"Some days I have zero energy. This is the formula.",               postTime:"7:30 AM" },
    { format:"Story",         bucket:"Road Trips",            title:"Drop Your Drive Suggestion (I'll Film It)",         hook:"Tell me where to drive. I'll film the whole thing.",               postTime:"9:00 AM" },
    { format:"Carousel",      bucket:"City Life & Cafés",     title:"30 Days of Content — What Actually Worked",         hook:"Posted every day. Here's what performed, flopped, and next.",       postTime:"8:00 AM" },
  ];
  return seeds.map((s, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    return { id:i+1, date:d.toISOString(), ...s, caption:"", cta:"", hashtags:"", script:null, trendLocked:false, aiGenerated:false };
  });
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { weekday:"short", month:"short", day:"numeric" });
}
export function fmtDateObj(d) {
  return d.toLocaleDateString("en-IN", { weekday:"short", month:"short", day:"numeric" });
}
