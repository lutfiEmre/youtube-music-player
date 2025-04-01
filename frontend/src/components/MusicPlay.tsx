import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';

const YOUTUBE_API_KEY = 'AIzaSyAkzFTngtR6RTs9AMF4lc4AH-R6hIzRdEY';

type PlaylistItem = {
    title: string;
    channel: string;
    url: string;
};

const initialPlaylist: PlaylistItem[] = [
    { title: "Shape of You", channel: "Ed Sheeran", url: "https://www.youtube.com/watch?v=JGwWNGJdvx8" },
    { title: "Blinding Lights", channel: "The Weeknd", url: "https://www.youtube.com/watch?v=4NRXx6U8ABQ" },
    { title: "Someone You Loved", channel: "Lewis Capaldi", url: "https://www.youtube.com/watch?v=bCuhuePlP8o" },
    { title: "Bad Guy", channel: "Billie Eilish", url: "https://www.youtube.com/watch?v=DyDfgMOUjCI" },
    { title: "Circles", channel: "Post Malone", url: "https://www.youtube.com/watch?v=wXhTHyIgQ_U" },
    { title: "Senorita", channel: "Shawn Mendes & Camila Cabello", url: "https://www.youtube.com/watch?v=Pkh8UtuejGw" },
    { title: "Uptown Funk", channel: "Mark Ronson ft. Bruno Mars", url: "https://www.youtube.com/watch?v=OPf0YbXqDm0" },
    { title: "Levitating", channel: "Dua Lipa", url: "https://www.youtube.com/watch?v=TUVcZfQe-Kw" },
    { title: "Rolling in the Deep", channel: "Adele", url: "https://www.youtube.com/watch?v=rYEDA3JcQqw" },
    { title: "Love me like you do", channel: "Ellie Goulding", url: "https://www.youtube.com/watch?v=5NV6Rdv1a3I" }
];

const MusicPlay: React.FC = () => {
    const [volume, setVolume] = useState<number>(50);
    const [playing, setPlaying] = useState<boolean>(false);
    const [muted, setMuted] = useState<boolean>(true);
    const [inputLink, setInputLink] = useState<string>('https://www.youtube.com/watch?v=5NV6Rdv1a3I');
    const [submittedLink, setSubmittedLink] = useState<string>(inputLink);
    const [videoTitle, setVideoTitle] = useState<string>('Love me like you do');
    const [channelTitle, setChannelTitle] = useState<string>('Ellie Goulding');
    const [channelAvatar, setChannelAvatar] = useState<string>('');
    const [playedSeconds, setPlayedSeconds] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [playlist, setPlaylist] = useState<PlaylistItem[]>(initialPlaylist);
    // Başlangıçta listenin sonundaki şarkı çalıyor.
    const [currentSongIndex, setCurrentSongIndex] = useState<number>(initialPlaylist.length - 1);

    const playerRef = useRef<ReactPlayer | null>(null);
    const currentUrl = submittedLink || 'https://www.youtube.com/watch?v=5NV6Rdv1a3I';

    function formatTime(seconds: number): string {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    }

    useEffect(() => {
        setPlaying(true);
        setMuted(true);
    }, []);

    useEffect(() => {
        const handleClick = () => {
            setMuted(false);
            window.removeEventListener('click', handleClick);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleProgress = useCallback((state: { playedSeconds: number }) => {
        setPlayedSeconds(state.playedSeconds);
    }, []);

    const handleDuration = useCallback((dur: number) => {
        setDuration(dur);
    }, []);

    const playedPercentage = duration ? (playedSeconds / duration) * 100 : 0;

    const handleTogglePlay = () => {
        setPlaying(prev => !prev);
    };

    const handleSubmit = () => {
        setSubmittedLink(inputLink);
        // Eğer URL kullanıcı tarafından girildiyse, API fetch’i sonrası bilgiler güncellenecek.
        setCurrentSongIndex(playlist.length - 1);
        setPlaying(true);
    };

    const handleSelectSong = (song: PlaylistItem, index: number) => {
        setSubmittedLink(song.url);
        setInputLink(song.url);
        setCurrentSongIndex(index);
        setPlaying(true);
        // Liste üzerinden seçilen şarkı bilgilerini anında göster.
        setVideoTitle(song.title);
        setChannelTitle(song.channel);
    };

    const handlePreviousSong = () => {
        const firstSong = playlist[0];
        setSubmittedLink(firstSong.url);
        setInputLink(firstSong.url);
        setCurrentSongIndex(0);
        setPlaying(true);
        setVideoTitle(firstSong.title);
        setChannelTitle(firstSong.channel);
    };

    const handleNextSong = () => {
        const nextIndex = currentSongIndex < playlist.length - 1 ? currentSongIndex + 1 : 0;
        const nextSong = playlist[nextIndex];
        setSubmittedLink(nextSong.url);
        setInputLink(nextSong.url);
        setCurrentSongIndex(nextIndex);
        setPlaying(true);
        setVideoTitle(nextSong.title);
        setChannelTitle(nextSong.channel);
    };

    useEffect(() => {
        async function fetchVideoData() {
            const videoId = parseYouTubeVideoId(currentUrl);
            if (!videoId) return;
            try {
                const vidRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
                );
                const vidData = await vidRes.json();
                if (!vidData.items || vidData.items.length === 0) return;
                const snippet = vidData.items[0].snippet;
                // Eğer kullanıcı URL ile manuel işlem yapıyorsa, API'den gelen verilerle güncelle
                setVideoTitle(snippet.title);
                setChannelTitle(snippet.channelTitle);
                const channelId = snippet.channelId;
                if (!channelId) return;
                const chRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
                );
                const chData = await chRes.json();
                if (!chData.items || chData.items.length === 0) return;
                const channelSnippet = chData.items[0].snippet;
                console.log("Channel snippet:", channelSnippet);
                setChannelAvatar(
                    channelSnippet.thumbnails?.default?.url ||
                    channelSnippet.thumbnails?.medium?.url ||
                    channelSnippet.thumbnails?.high?.url ||
                    'https://via.placeholder.com/450'
                );

                // Manuel URL güncellemesinde playlist'in son elemanını API verisine göre güncelle.
                setPlaylist(prev => {
                    const newPlaylist = [...prev];
                    newPlaylist[newPlaylist.length - 1] = { title: snippet.title, channel: snippet.channelTitle, url: currentUrl };
                    return newPlaylist;
                });
            } catch (error) {
                console.error('YouTube Data API error:', error);
            }
        }
        fetchVideoData();
    }, [currentUrl]);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    const handleDownloadMP3 = async () => {
        try {
            setIsDownloading(true);
            const downloadUrl = `http://localhost:3000/convert?videoUrl=${encodeURIComponent(inputLink)}`;
            const link = document.createElement("a");
            link.href = downloadUrl;
            // Eğer sunucunuz Content-Disposition header gönderiyorsa download attribute eklemenize gerek yok.
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };
    useEffect(() => {
        console.log(channelAvatar)
    },[channelAvatar])
    return (
        <div className="relative overflow-hidden w-full h-full">
            <div className="w-full bg-[#FAFAFA]/5 h-full z-20 p-[10px] border-[#FAFAFA]/10 border-[2px]">
                <div className="flex gap-[20px] items-center h-full w-full flex-col">
                    <PlayerDisplay channelAvatar={channelAvatar} channelTitle={channelTitle} videoTitle={videoTitle} />
                    <PlayerControls
                        playing={playing}
                        handleTogglePlay={handleTogglePlay}
                        handlePreviousSong={handlePreviousSong}
                        handleNextSong={handleNextSong}
                        volume={volume}
                        setVolume={setVolume}
                        playedPercentage={playedPercentage}
                        duration={duration}
                        playedSeconds={playedSeconds}
                        playerRef={playerRef}
                        formatTime={formatTime}
                    />
                    <InputField inputLink={inputLink} setInputLink={setInputLink} onSubmit={handleSubmit} />
                    <button onClick={handleDownloadMP3} className="bg-blue-500 text-white py-2 px-4 rounded">
                        {isDownloading ? "İndiriliyor" : "MP3 İndir"}
                    </button>

                </div>
            </div>
            <ReactPlayer
                ref={playerRef}
                url={currentUrl}
                playing={playing}
                muted={muted}
                volume={volume / 100}
                width={0}
                height={0}
                onProgress={handleProgress}
                onDuration={handleDuration}
                config={{ youtube: { playerVars: {} } }}
            />
            <SideMenu playlist={playlist} currentSongIndex={currentSongIndex} onSelectSong={handleSelectSong} />

        </div>
    );
};

type PlayerDisplayProps = {
    channelAvatar: string;
    channelTitle: string;
    videoTitle: string;
};

const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ channelAvatar, channelTitle, videoTitle }) => {
    return (
        <>
            <img className="w-[450px] h-[450px] object-cover" src={channelAvatar} alt={channelTitle} />
            <div className="ml-2 flex flex-col items-center gap-[10px] justify-center">
                <p className="ttfirsmedium whitespace-nowrap text-[28px] text-white">{videoTitle}</p>
                <p className="ttfirsregular whitespace-nowrap text-[30px] text-white/50">{channelTitle}</p>
            </div>
        </>
    );
};

type PlayerControlsProps = {
    playing: boolean;
    handleTogglePlay: () => void;
    handlePreviousSong: () => void;
    handleNextSong: () => void;
    volume: number;
    setVolume: React.Dispatch<React.SetStateAction<number>>;
    playedPercentage: number;
    duration: number;
    playedSeconds: number;
    playerRef: React.RefObject<ReactPlayer>;
    formatTime: (seconds: number) => string;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
                                                           playing,
                                                           handleTogglePlay,
                                                           handlePreviousSong,
                                                           handleNextSong,
                                                           volume,
                                                           setVolume,
                                                           playedPercentage,
                                                           duration,
                                                           playedSeconds,
                                                           playerRef,
                                                           formatTime,
                                                       }) => {
    return (
        <>
            <div className="flex flex-col w-fit gap-[20px]">
                <div className="ml-[20px] items-center gap-[10px] flex flex-row">
                    {/* Önceki şarkı için svg */}
                    <svg onClick={handlePreviousSong} className="w-[65px] h-[65px] cursor-pointer" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <g clipPath="url(#clip0_28_682)">
                            <g clipPath="url(#clip1_28_682)">
                                <path d="M8.19996 6C8.32373 6 8.44243 6.04917 8.52994 6.13668C8.61746 6.2242 8.66663 6.3429 8.66663 6.46667V11.0033L16.6333 6.404C16.7042 6.36305 16.7847 6.34148 16.8666 6.34148C16.9485 6.34147 17.029 6.36302 17.0999 6.40396C17.1708 6.44491 17.2297 6.5038 17.2707 6.57472C17.3117 6.64564 17.3333 6.7261 17.3333 6.808V17.192C17.3333 17.2739 17.3117 17.3544 17.2707 17.4253C17.2297 17.4962 17.1708 17.5551 17.0999 17.596C17.029 17.637 16.9485 17.6585 16.8666 17.6585C16.7847 17.6585 16.7042 17.637 16.6333 17.596L8.66663 12.9967V17.5333C8.66663 17.6571 8.61746 17.7758 8.52994 17.8633C8.44243 17.9508 8.32373 18 8.19996 18H7.13329C7.00952 18 6.89083 17.9508 6.80331 17.8633C6.71579 17.7758 6.66663 17.6571 6.66663 17.5333V6.46667C6.66663 6.3429 6.71579 6.2242 6.80331 6.13668C6.89083 6.04917 7.00952 6 7.13329 6H8.19996Z" fill="#FAFAFA" />
                            </g>
                        </g>
                        <defs>
                            <clipPath id="clip0_28_682">
                                <rect width="24" height="24" fill="white" />
                            </clipPath>
                            <clipPath id="clip1_28_682">
                                <rect width="16" height="16" fill="white" transform="translate(4 4)" />
                            </clipPath>
                        </defs>
                    </svg>
                    {/* Play/Pause */}
                    <svg onClick={handleTogglePlay} className="w-[65px] h-[65px] flex items-center justify-center cursor-pointer" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        {playing ? (
                            <path d="M10.2857 5H6V19H10.2857V5ZM18 5H13.7143V19H18V5Z" fill="#FAFAFA" />
                        ) : (
                            <g>
                                <path d="M6 19H8.4L18 12L8.4 5L6 5V19Z" fill="white" />
                            </g>
                        )}
                    </svg>
                    {/* Boş svg (başka işlem için kullanılabilir) */}

                    {/* Sonraki şarkı için svg */}
                    <svg onClick={handleNextSong} className="w-[65px] h-[65px] cursor-pointer" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M16.1333 6C16.0095 6 15.8908 6.04917 15.8033 6.13668C15.7158 6.2242 15.6666 6.3429 15.6666 6.46667V11.0033L7.69996 6.404C7.62903 6.36305 7.54857 6.34148 7.46666 6.34148C7.38476 6.34147 7.30429 6.36302 7.23335 6.40396C7.16242 6.44491 7.1035 6.5038 7.06254 6.57472C7.02157 6.64564 6.99998 6.7261 6.99996 6.808V17.192C6.99998 17.2739 7.02157 17.3544 7.06254 17.4253C7.1035 17.4962 7.16242 17.5551 7.23335 17.596C7.30429 17.637 7.38476 17.6585 7.46666 17.6585C7.54857 17.6585 7.62903 17.637 7.69996 17.596L15.6666 12.9967V17.5333C15.6666 17.6571 15.7158 17.7758 15.8033 17.8633C15.8908 17.9508 16.0095 18 16.1333 18H17.2C17.3237 18 17.4424 17.9508 17.5299 17.8633C17.6175 17.7758 17.6666 17.6571 17.6666 17.5333V6.46667C17.6666 6.3429 17.6175 6.2242 17.5299 6.13668C17.4424 6.04917 17.3237 6 17.2 6H16.1333Z" fill="#FAFAFA" />
                    </svg>
                    <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-[150px] h-[15px] select-none mt-1 ml-4 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                    <svg className="mx-[55px] w-[2px] h-[100px]" width="1" height="36" viewBox="0 0 1 36" fill="none">
                        <line x1="0.5" y1="0" x2="0.499998" y2="36" stroke="url(#paint0_linear_28_692)" />
                        <defs>
                            <linearGradient id="paint0_linear_28_692" x1="-0.5" y1="0" x2="-0.500002" y2="36" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FAFAFA" stopOpacity="0" />
                                <stop offset="0.505" stopColor="#FAFAFA" />
                                <stop offset="1" stopColor="#FAFAFA" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="flex w-full items-center flex-row gap-[21px]">
                    <h6 className="ttfirsregular w-[45px] text-[24px] text-[#FAFAFA]">{formatTime(playedSeconds)}</h6>
                    <div
                        className="w-full select-none -mt-[1px] h-[25px] relative bg-[#FAFAFA]/10"
                        onClick={(e) => {
                            if (!playerRef.current) return;
                            const { left, width } = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - left;
                            const fraction = clickX / width;
                            const newTime = duration * fraction;
                            playerRef.current.seekTo(newTime, 'seconds');
                        }}
                    >
                        <div className="absolute transition-all duration-300 ease-out top-0 h-full left-0 bg-[#FAFAFA]" style={{ width: `${playedPercentage}%` }} />
                    </div>
                    <h6 className="ttfirsregular w-[45px] text-[24px] text-[#FAFAFA]">{formatTime(duration)}</h6>
                </div>
            </div>
        </>
    );
};

type InputFieldProps = {
    inputLink: string;
    setInputLink: React.Dispatch<React.SetStateAction<string>>;
    onSubmit: () => void;
};

const InputField: React.FC<InputFieldProps> = ({ inputLink, setInputLink, onSubmit }) => {
    return (
        <div className="w-fit min-w-[800px] cursor-pointer select-none p-[10px] pr-[5px] mt-5 flex justify-between items-center h-fit bg-[#FAFAFA]/5">
            <div className="flex w-full flex-row items-center gap-[10px]">
                <svg className="w-[40px] h-[40px]" width="40" height="40" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.5">
                        <path d="M7.2 11.5714L11.871 9L7.2 6.42857V11.5714Z" fill="white" />
                    </g>
                </svg>
                <input
                    value={inputLink}
                    onChange={(e) => setInputLink(e.target.value)}
                    className="ttfirsmedium w-full min-w-[300px] text-[30px] text-white/50 bg-transparent outline-none border-none"
                    placeholder=" Enter YouTube url to play..."
                    type="text"
                />
            </div>
            <svg onClick={onSubmit} className="opacity-50 mr-4 cursor-pointer" width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.5124 0.22716C10.657 0.081702 10.8531 0 11.0576 0C11.262 0 11.4581 0.081702 11.6027 0.22716L17.7744 6.44108C17.9189 6.58671 18 6.78413 18 6.98997C18 7.19581 17.9189 7.39323 17.7744 7.53887L11.6027 13.7528C11.5321 13.8291 11.4469 13.8903 11.3523 13.9328C11.2577 13.9752 11.1555 13.998 11.0519 13.9999C10.9483 14.0017 10.8455 13.9825 10.7494 13.9435C10.6533 13.9044 10.5661 13.8463 10.4928 13.7725C10.4196 13.6987 10.3618 13.6109 10.323 13.5142C10.2842 13.4174 10.2652 13.3139 10.267 13.2096C10.2688 13.1053 10.2915 13.0024 10.3336 12.9071C10.3758 12.8119 10.4366 12.7261 10.5124 12.655L15.3674 7.76671H0.771458C0.566854 7.76671 0.370631 7.68488 0.225955 7.53921C0.0812782 7.39354 0 7.19598 0 6.98997C0 6.78397 0.0812782 6.5864 0.225955 6.44073C0.370631 6.29507 0.566854 6.21323 0.771458 6.21323H15.3674L10.5124 1.32495C10.3679 1.17931 10.2868 0.981893 10.2868 0.776056C10.2868 0.570219 10.3679 0.372799 10.5124 0.22716Z" fill="#FAFAFA" />
            </svg>
        </div>
    );
};

type SideMenuProps = {
    playlist: PlaylistItem[];
    currentSongIndex: number;
    onSelectSong: (song: PlaylistItem, index: number) => void;
};

const SideMenu: React.FC<SideMenuProps> = ({ playlist, currentSongIndex, onSelectSong }) => {
    return (
        <div className="absolute right-0 top-[10vh] h-full w-[300px] bg-black/70 p-4 overflow-y-auto">
            {playlist.map((item, index) => (
                <div
                    key={index}
                    className={`mb-4 cursor-pointer ${index === currentSongIndex ? 'text-red-500' : 'text-white'}`}
                    onClick={() => onSelectSong(item, index)}
                >
                    <p className="text-lg">{item.title}</p>
                    <p className="text-sm text-gray-400">{item.channel}</p>
                </div>
            ))}
        </div>
    );
};

function parseYouTubeVideoId(url: string): string | null {
    try {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    } catch (error) {
        return null;
    }
}

export default MusicPlay;
