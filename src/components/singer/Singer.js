import React, { Component } from "react";
import ReactDOM from "react-dom";
import {CSSTransition} from "react-transition-group";
// import {getTransitionEndName} from "../../util/event";
import Header from "../../common/header/Header";
import Scroll from "../../common/scroll/Scroll";
import Loading from "../../common/loading/Loading";
import {getSingerInfo} from "../../api/singer";
import {getSongVKey} from "../../api/song";
import {CODE_SUCCESS} from "../../api/config";
import * as SingerModel from "../../model/singer";
import * as SongModel from "../../model/song";
import "./singer.less";

class Singer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			show: false,
			loading: true,
			singer: {},
			songs: [],
			refreshScroll: false
		}
	}
	componentDidMount() {
        this.setState({
            show: true
        });
		let albumBgDOM = ReactDOM.findDOMNode(this.refs.albumBg);
		let albumContainerDOM = ReactDOM.findDOMNode(this.refs.albumContainer);
		albumContainerDOM.style.top = albumBgDOM.offsetHeight + "px";

		getSingerInfo(this.props.match.params.id).then((res) => {
			//console.log("获取歌手详情：");
			if (res) {
				//console.log(res);
				if (res.code === CODE_SUCCESS) {
					let singer = SingerModel.createSingerByDetail(res.data);
					singer.desc = res.data.desc;

					let songList = res.data.list;
					let songs = [];
					songList.forEach(item => {
						if (item.musicData.pay.payplay === 1) { return }
						let song = SongModel.createSong(item.musicData);
						//获取歌曲vkey
						this.getSongUrl(song, song.mId);
						songs.push(song);
					});
					this.setState({
						loading: false,
						singer: singer,
						songs: songs
					}, () => {
						//刷新scroll
						this.setState({refreshScroll:true});
					});
				}
			}
		});
	}
	getSongUrl(song, mId) {
		getSongVKey(mId).then((res) => {
			if (res) {
				if(res.code === CODE_SUCCESS) {
					if(res.data.items) {
						let item = res.data.items[0];
						song.url =  `http://dl.stream.qqmusic.qq.com/${item.filename}?vkey=${item.vkey}&guid=3655047200&fromtag=66`
					}
				}
			}
		});
	}
	/**
	 * 选择歌曲
	 */
	selectSong(song) {
		return (e) => {
			this.props.setSongs([song]);
			this.props.changeCurrentSong(song);
		};
	}
	/**
	 * 播放全部
	 */
	playAll = () => {
		if (this.state.songs.length > 0) {
			//添加播放歌曲列表
			this.props.setSongs(this.state.songs);
			this.props.changeCurrentSong(this.state.songs[0]);
			this.props.showMusicPlayer(true);
		}
	}
	/**
	 * 监听scroll
	 */
	scroll = ({y}) => {
		let headerDOM = ReactDOM.findDOMNode(this.refs.header);
		let albumBgDOM = ReactDOM.findDOMNode(this.refs.albumBg);
		let albumFixedBgDOM = ReactDOM.findDOMNode(this.refs.albumFixedBg);
		let playButtonWrapperDOM = ReactDOM.findDOMNode(this.refs.playButtonWrapper);
		if (y < 0) {
			if (Math.abs(y) + 55 > albumBgDOM.offsetHeight) {
				albumFixedBgDOM.style.display = "block";
			} else {
				albumFixedBgDOM.style.display = "none";
			}
			let bgColor = `rgba(194,17,17,${0+1*(Math.abs(y)/(albumBgDOM.offsetHeight-55))})`;
            headerDOM.style['backgroundColor'] = bgColor;
		} else {
			let transform = `scale(${1 + y * 0.004}, ${1 + y * 0.004})`;
			albumBgDOM.style["webkitTransform"] = transform;
			albumBgDOM.style["transform"] = transform;
			playButtonWrapperDOM.style.marginTop = `${y}px`;
		}
	}
	render() {
		let singer = this.state.singer;
		let songs = this.state.songs.map((song) => {
			return (
				<div className="song" key={song.id} onClick={this.selectSong(song)}>
					<div className="song-name">{song.name}</div>
					<div className="song-singer">{song.singer}</div>
				</div>
			);
		});
		return (
			<CSSTransition in={this.state.show} timeout={300} classNames="translate">
			<div className="music-singer">
				<Header title={singer.name} ref="header"></Header>
				<div style={{position:"relative"}}>
					<div ref="albumBg" className="singer-img" style={{backgroundImage: `url(${singer.img})`}}>
						<div className="filter"></div>
					</div>
					<div ref="albumFixedBg" className="singer-img fixed" style={{backgroundImage: `url(${singer.img})`}}>
						<div className="filter"></div>
					</div>
					<div className="play-wrapper" ref="playButtonWrapper">
						<div className="play-button" onClick={this.playAll}>
							<i className="iconfont icon-bofang"></i>
							<span>播放全部</span>
						</div>
					</div>
				</div>
				<div ref="albumContainer" className="singer-container">
					<div className="singer-scroll" style={this.state.loading === true ? {display:"none"} : {}}>
						<Scroll refresh={this.state.refreshScroll} onScroll={this.scroll}>
							<div className="singer-wrapper">
								<div className="song-count">歌曲 共{songs.length}首</div>
								<div className="song-list">
									{songs}
								</div>
							</div>
						</Scroll>
					</div>
					<Loading title="正在加载..." show={this.state.loading}/>
				</div>
			</div>
			</CSSTransition>
		);
	}
}

export default Singer