// Snapshot data for the Manager module.
// Captured 13 Nov 2026 from Windsor.ai (Instagram insights, last 30 days),
// vidIQ outlier search and the Google Drive "Pictures" footage folder.
// The Performance tab replaces this with live data when a Windsor API key is set.

export const SNAPSHOT_DATE = "2026-11-13";

export const ACCOUNT = {
  handle: "inside_my_backpack",
  followers: 4395,
  totalPosts: 272,
  newFollowers30d: 43,
};

// media_type, views, reach, shares, saves, engagement, avg watch (ms), skip rate (0-1)
export const POSTS = [
  { date:"2026-10-14", type:"REELS", caption:"10/10 #travel #kerela #offbeatkerala", url:"https://www.instagram.com/reel/DefIsDiyRul/", views:389, reach:231, shares:0, saves:1, engagement:21, watchMs:4165, skip:0.626 },
  { date:"2026-10-15", type:"REELS", caption:"Tag that Kaabil dost", url:"https://www.instagram.com/reel/DegFatLyh54/", views:2534, reach:2104, shares:48, saves:5, engagement:117, watchMs:7313, skip:0.293 },
  { date:"2026-10-20", type:"REELS", caption:"😶‍🌫️💨 #millennial #singlelife #bangalore", url:"https://www.instagram.com/reel/DeunJ5ey1SP/", views:1646, reach:1452, shares:1, saves:3, engagement:64, watchMs:5262, skip:0.376 },
  { date:"2026-10-24", type:"REELS", caption:"This reel is not about a camera. It is about growth.", url:"https://www.instagram.com/reel/De4LPViy6UP/", views:1846, reach:1380, shares:0, saves:2, engagement:65, watchMs:6227, skip:0.444 },
  { date:"2026-10-25", type:"REELS", caption:"My death is guaranteed... but finding a soulmate isn't.", url:"https://www.instagram.com/reel/De52oS-yYyc/", views:1821, reach:1511, shares:8, saves:13, engagement:127, watchMs:6075, skip:0.529 },
  { date:"2026-10-29", type:"REELS", caption:"#travel #roadtrip #biker", url:"https://www.instagram.com/reel/DfEHT_TyW2m/", views:1642, reach:1275, shares:10, saves:5, engagement:64, watchMs:5486, skip:0.338 },
  { date:"2026-11-01", type:"CAROUSEL_ALBUM", caption:"Out of Office. Into Myself. 🏔️", url:"https://www.instagram.com/p/DfL7E2lGULi/", views:444, reach:177, shares:0, saves:0, engagement:24, watchMs:null, skip:null },
  { date:"2026-11-03", type:"REELS", caption:"Life gives you lemons, make a lemonade…", url:"https://www.instagram.com/reel/DfSJba7MKlt/", views:3615, reach:2888, shares:22, saves:25, engagement:128, watchMs:3366, skip:0.683 },
  { date:"2026-11-04", type:"REELS", caption:"Ghar toh wahi hai… bas ab dil kahin aur lagta hai. 🌿", url:"https://www.instagram.com/reel/DfTVWXVBamK/", views:176, reach:120, shares:0, saves:0, engagement:20, watchMs:4322, skip:0.65 },
  { date:"2026-11-05", type:"REELS", caption:"The only walk that matters", url:"https://www.instagram.com/reel/DfWozSASBxT/", views:2678, reach:1953, shares:5, saves:10, engagement:76, watchMs:5066, skip:0.436 },
  { date:"2026-11-06", type:"CAROUSEL_ALBUM", caption:"Somewhere between good coffee, aesthetic corners…", url:"https://www.instagram.com/p/DfaQfREGep2/", views:738, reach:281, shares:0, saves:0, engagement:41, watchMs:null, skip:null },
  { date:"2026-11-06", type:"REELS", caption:"Night driving tips — only for entertainment purpose", url:"https://www.instagram.com/reel/DfZ0hAByTL0/", views:1862, reach:1543, shares:16, saves:7, engagement:87, watchMs:7601, skip:0.324 },
  { date:"2026-11-07", type:"REELS", caption:"For the once who got left behind. Happy Diwali 🪔", url:"https://www.instagram.com/reel/Dfc39AsyXHr/", views:5077, reach:4061, shares:29, saves:20, engagement:339, watchMs:5747, skip:0.419 },
  { date:"2026-11-08", type:"REELS", caption:"May this Diwali illuminate your life…", url:"https://www.instagram.com/reel/DfdzjdxB5pD/", views:2595, reach:2101, shares:122, saves:0, engagement:160, watchMs:2655, skip:0.816 },
  { date:"2026-11-08", type:"REELS", caption:"Baarishein #rain #monsoon", url:"https://www.instagram.com/reel/DfdfdTChVYf/", views:307, reach:221, shares:0, saves:0, engagement:14, watchMs:4205, skip:0.596 },
  { date:"2026-11-09", type:"REELS", caption:"This is indeed the premium version of earth #munnar", url:"https://www.instagram.com/reel/DfhksiEyjfc/", views:366, reach:247, shares:1, saves:0, engagement:16, watchMs:3617, skip:0.773 },
  { date:"2026-11-10", type:"REELS", caption:"Somewhere above the clouds sits a tea garden holding a world record.", url:"https://www.instagram.com/reel/DfjopqYsh0D/", views:1260, reach:1081, shares:1, saves:5, engagement:107, watchMs:4865, skip:0.659 },
  { date:"2026-11-11", type:"REELS", caption:"Windmill Temple — 3hrs from namma Bengaluru", url:"https://www.instagram.com/reel/DfmkcaByHGI/", views:1489, reach:1209, shares:4, saves:9, engagement:41, watchMs:5036, skip:0.648 },
];

// Drive: My Drive/Pictures. status: posted | planned | unposted | unknown
// "unposted" = place not found in captions of the 44 most recent reels.
export const FOOTAGE = [
  { folder:"Shivanasamudra Falls", date:"2026-08-08", status:"planned", contents:"5 drone clips, 9 drone photos (+ phone/Sony shots in Lightroom)", note:"Edited 5-photo carousel ready — Fri 13 Nov evening." },
  { folder:"KSR Backwater", date:"2026-08-31", status:"planned", contents:"9 drone clips", note:"Sunday reel. Hook: 'Ye samundar nahi hai ❌'. Clips 0186 → 0181 → 0183 → 0185 → 0179 → 0186." },
  { folder:"Windmill", date:"2026-11-11", status:"planned", contents:"11 drone clips", note:"Re-cut (vertical, 15s, temple-first hook) for Saturday. One windmill reel already posted 11 Nov." },
  { folder:"Himachal", date:"2026-09-20", status:"planned", contents:"Bike POV: AP Bike Full.mp4, Bike 1.mp4", note:"Suttabaz-dost reel Fri morning. Similar smoker joke already posted (DdnMD0Yhg7L)." },
  { folder:"Twinkle Shoot / Church Street", date:"2026-09-18", status:"unposted", contents:"19 Sony clips", note:"Idea: 'Church Street in one evening' listicle reel." },
  { folder:"Ooty", date:"2026-07-04", status:"posted", contents:"10 drone clips + 15 phone clips", note:"Group quickshot already posted." },
  { folder:"Munnar", date:"2026-09-13", status:"posted", contents:"28 clips, ~137 photos", note:"10+ reels posted — tapped out." },
  { folder:"Goa", date:"2025-01-11", status:"unposted", contents:"—", note:"Throwback / 'best of' material." },
  { folder:"Pondicherry", date:"2023-08-21", status:"unposted", contents:"—", note:"Throwback material." },
  { folder:"Chikmangaluru", date:"2025-09-23", status:"unknown", contents:"—", note:"Older than the 44 reels checked." },
  { folder:"Hoganekkal Falls", date:"2025-05-04", status:"unknown", contents:"—", note:"Older than the 44 reels checked." },
  { folder:"Nalligudde Lake", date:"2025-02-20", status:"unknown", contents:"—", note:"Older than the 44 reels checked." },
];

// vidIQ outlier search, 13 Nov 2026 (posts that beat the creator's own median)
export const SCOUT = [
  { handle:"@saquibiltaf", views:"11.3M", multiple:"566×", hook:"The most beautiful abandoned city in India", format:"Google-Earth zoom-in → smooth drone shots, slow ballad", url:"https://www.instagram.com/reel/Deee1c1q-PV", angle:"Comparison / 'X of India' drone reveal" },
  { handle:"@lehexpresss", views:"3M", multiple:"487×", hook:"Police stopped us carrying petrol at Atal Tunnel", format:"Handlebar POV + voiceover facts", url:"https://www.instagram.com/reel/DfEEaKexLzb", angle:"Bike POV with a story" },
  { handle:"@akshittravels_", views:"1.7M", multiple:"9×", hook:"The only therapy to forget your past", format:"Beat-synced bike montage, one static text line", url:"https://www.instagram.com/reel/DfFnu9eSDLW", angle:"Bike POV + relatable text" },
  { handle:"@byte.with.rish", views:"1.5M", multiple:"724×", hook:"Is baar Sunday khatam hone pe bhi tension nahi…", format:"Night POV drive + one Hinglish text block", url:"https://www.instagram.com/reel/DepbK7-zEex", angle:"Sunday/Monday relatable text" },
  { handle:"@itz_rohan07__", views:"1.1M", multiple:"119×", hook:"Kacheri (lyric text on each beat)", format:"POV + landscape cuts, lyric captions", url:"https://www.instagram.com/reel/DfFEu2OTHed", angle:"Lyric-synced travel diary" },
  { handle:"@le.bangalore", views:"860K", multiple:"9×", hook:"Bangalore is less crowded now. Explore these places before they return", format:"Fast listicle montage, location labels", url:"https://www.instagram.com/reel/Dfd02iqTcRn", angle:"Bangalore listicle" },
  { handle:"@nomad_sarva", views:"685K", multiple:"3×", hook:"This is not Switzerland ❌ 4 hrs from Bangalore", format:"Drone B-roll over voiceover", url:"https://www.instagram.com/reel/DfKTp58JkNY", angle:"'Not X — near Bangalore' comparison" },
  { handle:"@rishabhtheexplorer", views:"208K", multiple:"73×", hook:"Alexa, forget Manali. Show me something different.", format:"Cinematic cuts, loops to first shot", url:"https://www.instagram.com/reel/DfeHYfJR8aO", angle:"Alternative-destination hook (449 followers!)" },
];

export const PLAN = [
  { id:1, day:"Fri 13 Nov", time:"Morning", format:"Reel", title:"Suttabaz dost — Himachal bike POV", hook:"That one suttabaz dost whenever he sees a view", status:"Ready",
    caption:"Every group has that one dost — the view comes first, and only then does the trip begin 😂🏔️ Tag him and let him know he's been caught 👇 📍Himachal #bikeride #friendshipgoals #himachal #roadtrip #funnyreels" },
  { id:2, day:"Fri 13 Nov", time:"7:00 PM", format:"Carousel", title:"Shivanasamudra Falls — 5 photos", hook:"Wide → river level → close → top", status:"Edited",
    caption:"Bengaluru ke paas monsoon ka asli show 🌊 Shivanasamudra hits different when it's in full flow. Swipe till the end 👉 and save this for next monsoon 📌 📍Shivanasamudra Falls, Karnataka #shivanasamudra #karnatakatourism #bangaloreweekend #waterfallsofindia #monsoontravel" },
  { id:3, day:"Sat 14 Nov", time:"Evening", format:"Reel", title:"Windmill Temple (re-cut)", hook:"A temple guarded by giant windmills", status:"Edited",
    caption:"Bengaluru se sirf 3 ghante… and it feels like another planet 🌀 A hilltop Shiva temple surrounded by giant windmills, with one hairpin climb to the top. Comment \"WINDMILL\" and I'll DM you the exact location 📍 Save this for your next weekend drive. #bangaloreoffbeat #weekendgetaway #karnatakatourism #dronefootage #hiddengem" },
  { id:4, day:"Sun 15 Nov", time:"6–7 PM", format:"Reel", title:"KSR Backwater — 'Ye samundar nahi hai'", hook:"Bengaluru ke paas… YE SAMUNDAR NAHI HAI ❌", status:"Editing",
    caption:"Ye samundar nahi hai 😱 It's a hidden backwater near Bengaluru, perfect for a Sunday drive 🚗🌊 Comment \"BACKWATER\" and I'll DM you the exact location 📍 #bangaloreweekend #hiddengem #weekendgetaway #dronefootage #karnatakatourism" },
];
