import { useCallback, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { Like } from "../../assets/Like";
import { Play } from "../../assets/Play";
import { Pause } from "../../assets/Pause";
import { Volume } from "../../assets/Volume";
import styles from "./Player.module.scss";
import Sound from "react-sound";
import { millisToMinutesAndSeconds } from "../../utils/msToMinutes";
import { useBar } from "../../utils/useBar";
import { VolumeMuted } from "../../assets/VolumeMuted";
import { Track } from "../../types/Track";
import { GetCurrentPlayingTrack } from "../../API";
import Modal from "../Modal/Modal";

type PlayerProps = {
  playPause: () => void;
  song: Track;
  playing: boolean;
};

const Player = ({ playPause, song, playing }: PlayerProps) => {
  const [time, setTime] = useState(0);
  const timeRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const [volume, setVolume] = useState(70);
  const volumeRef = useRef<HTMLDivElement | null>(null);

  const [mute, setMute] = useState(false);
  const [track, setTrack] = useState();
  const [playList, setPlaylist] = useState([]);
  const [playlistSelect, setPlayListSelect] = useState("");
  const [sidebarState, setState] = useState({
    addModal: false,
  });

  const barCallBack = useBar;

  const handleAddModal = () =>
    setState({ ...sidebarState, addModal: !sidebarState.addModal });

  const loadPlaylists = useCallback(async () => {
    let cachedList: any = localStorage.getItem("playlist");
    let playListArray = JSON.parse(cachedList) || [];
    setPlaylist(playListArray);
  }, [setPlaylist]);

  const handleSelect = useCallback(
    (e) => {
      setPlayListSelect(e.target.value);
    },
    [setPlayListSelect]
  );

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const saveToPlaylist = (playlistSelect: string, play: any) => {
    let foundPlayList = currentPlayList.findIndex(
      (pL: any) => pL.id === playlistSelect
    );
    currentPlayList[foundPlayList].tracks.push(play);
    localStorage.setItem("playlist", JSON.stringify(currentPlayList));
    setState({
      ...sidebarState,
      addModal: false,
    });
  };

  const loadCurrentSong = useCallback(async () => {
    await GetCurrentPlayingTrack().then((data) => {
      setTrack(data.item);
    });
  }, []);

  useEffect(() => {
    loadCurrentSong();
  }, [loadCurrentSong]);

  useEffect(() => {
    // Adjust time when progress bar is clicked
    setTime((progress * 30000) / 100);
  }, [progress]);

  useEffect(() => {
    //Reset progress if the song change
    setProgress(0);
    setTime(0);
  }, [track]);

  useEffect(() => {
    if (volume < 5) {
      setMute(true);
    } else {
      setMute(false);
    }
  }, [volume]);
  const play: any = track || song;
  const currentPlayList: any = playList;
  if (!track) {
    return null;
  } else {
    return (
      <div className={styles.Player}>
        <footer>
          <div className={styles.Song}>
            <div className={styles.Img}>
              <img src={play.album.images[1].url} alt="song" />
            </div>
            <div className={styles.Infos}>
              <div className={styles.Name}>{play.name}</div>
              <div className={styles.Artist}>{play.artists[0].name}</div>
            </div>
            <div className={styles.Like} onClick={handleAddModal}>
              <p>Add To Playlist</p>
              <Like />
            </div>
          </div>

          <div className={styles.Controls}>
            <div>
              <button onClick={playPause}>
                {playing ? <Pause /> : <Play />}
              </button>
            </div>
            <div className={styles.BarContainer}>
              <div>{millisToMinutesAndSeconds(time)}</div>
              <div
                className={styles.Wrapper}
                onClick={(event) => barCallBack(event, timeRef, setProgress)}
                ref={timeRef}
              >
                <div className={styles.Bar}>
                  <div
                    className={styles.Progress}
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </div>
                <button style={{ left: `${progress}%` }} />
              </div>
              <div>0:30</div>
            </div>
          </div>

          <div className={styles.Volume}>
            <div>
              <button onClick={() => setMute(!mute)}>
                {mute ? <VolumeMuted /> : <Volume />}
              </button>
            </div>
            <div
              className={styles.Wrapper}
              onClick={(event) => barCallBack(event, volumeRef, setVolume)}
              ref={volumeRef}
            >
              <div className={styles.Bar}>
                <div
                  className={styles.Progress}
                  style={{
                    transform: `translateX(-${mute ? "100" : 100 - volume}%)`,
                  }}
                />
              </div>
              <button style={{ left: `${mute ? "0" : volume}%` }} />
            </div>
          </div>
        </footer>
        {play.preview_url && (
          <Sound
            url={play.preview_url}
            playStatus={playing ? "PLAYING" : "PAUSED"}
            //@ts-ignore
            onPlaying={({ position }) => {
              setTime(position);
              setProgress((position * 100) / 30000);
            }}
            onFinishedPlaying={() => playPause()}
            volume={mute ? 0 : volume}
            position={time}
          />
        )}
        <Modal show={sidebarState.addModal} close={handleAddModal}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 20 }}>
              Add To Playlist
            </div>

            {currentPlayList.length < 1 ? (
              <>
                <p>
                  You don't have any custom playlists yet. Start by creating one
                  after playing music in your app!
                </p>
                <div style={{ marginTop: 15 }}>
                  <button onClick={handleAddModal}>Ok</button>
                </div>
              </>
            ) : (
              <>
                <select
                  value={playlistSelect}
                  onChange={handleSelect}
                  style={{
                    fontSize: 16,
                    textTransform: "capitalize",
                    width: 115,
                    height: 25,
                    borderRadius: "5px",
                  }}
                >
                  <option value="">Choose</option>

                  {currentPlayList.map((list: any) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: 20 }}>
                  <button
                    style={{
                      backgroundColor: "green",
                      borderRadius: "5px",
                    }}
                    onClick={() => {
                      if (playlistSelect === "") return;
                      saveToPlaylist(playlistSelect, play);
                      setPlayListSelect("");
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    );
  }
};

const mapStateToProps = (state: {
  playing: { song: Track; playing: boolean };
}) => {
  return {
    song: state.playing.song,
    playing: state.playing.playing,
  };
};

const mapDispatchToProps = (
  dispatch: (playPause: { type: string }) => void
) => {
  return {
    playPause: () => dispatch({ type: "playpause" }),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Player);
