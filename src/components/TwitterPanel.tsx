import { useState } from 'react'
import type { GameState, PostType } from '../game/types'
import { POST_TYPES, POST_TYPE_MAP, followerBoost } from '../game/social'
import { globalWeek } from '../game/state'
import { CAMPAIGN_COOLDOWN, CAMPAIGN_COST } from '../game/constants'
import './Game.css'

interface Props {
  state: GameState
  onPost: (text: string, type: PostType) => void
  onSmear: (competitorId: string) => void
  onLaunchCampaign: () => void
  onClose: () => void
}

export function TwitterPanel({ state, onPost, onSmear, onLaunchCampaign, onClose }: Props) {
  const [text, setText] = useState('')
  const [postType, setPostType] = useState<PostType>('announcement')

  const currentWeek = globalWeek(state)
  const onCooldown = currentWeek <= state.lastPostWeek
  const boost = followerBoost(state.followers)

  const hasMarketer = state.staff.some((s) => s.role === 'marketer')
  const campaignActive = state.campaignWeeksLeft > 0
  const weeksSinceCampaign = currentWeek - state.lastCampaignWeek
  const campaignReady = hasMarketer && !campaignActive && weeksSinceCampaign >= CAMPAIGN_COOLDOWN

  function post() {
    if (!text.trim() || onCooldown) return
    onPost(text, postType)
    setText('')
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">🐦 Twitter</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="twitter-stats">
        <span className="twitter-followers">{state.followers.toLocaleString()} followers</span>
        <span className="twitter-boost">Growth ×{boost.toFixed(2)}</span>
      </div>

      <div className="twitter-composer">
        <div className="filter-group">
          <label>Post type</label>
          <div className="filter-buttons">
            {POST_TYPES.map((p) => (
              <button
                key={p.id}
                className={`filter-btn ${postType === p.id ? 'active' : ''}`}
                onClick={() => setPostType(p.id)}
                title={p.description}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={text}
          maxLength={140}
          placeholder="What's happening?"
          onChange={(e) => setText(e.target.value)}
        />
        <div className="twitter-actions">
          <span className="twitter-count">{text.length}/140</span>
          <button className="hire-btn" disabled={!text.trim() || onCooldown} onClick={post}>
            {onCooldown ? 'Cooldown (next week)' : 'Post'}
          </button>
        </div>
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">Post negative about a competitor</h4>
        <div className="smear-list">
          {state.competitors.map((c) => (
            <div className="smear-row" key={c.id}>
              <span className="smear-name">
                {c.icon} {c.name}
              </span>
              <button className="hire-btn" disabled={onCooldown} onClick={() => onSmear(c.id)}>
                Smear
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="smear-section">
        <h4 className="model-list-title">📣 Marketing Campaign</h4>
        {campaignActive ? (
          <p className="placeholder">
            Campaign running: 2x customers for {state.campaignWeeksLeft} more week
            {state.campaignWeeksLeft > 1 ? 's' : ''}.
          </p>
        ) : (
          <div className="smear-row">
            <span className="smear-name">
              {!hasMarketer
                ? 'Need a marketer'
                : weeksSinceCampaign < CAMPAIGN_COOLDOWN
                  ? `Cooldown: ${CAMPAIGN_COOLDOWN - weeksSinceCampaign}wk`
                  : '2x customers for 4 weeks'}
            </span>
            <button
              className="hire-btn"
              disabled={!campaignReady || state.money < CAMPAIGN_COST}
              onClick={onLaunchCampaign}
            >
              Launch (${(CAMPAIGN_COST / 1000).toFixed(0)}k)
            </button>
          </div>
        )}
      </div>

      <div className="twitter-feed">
        <h4 className="model-list-title">Your Posts</h4>
        {state.posts.length === 0 && (
          <p className="placeholder">No posts yet. Share something to grow your audience!</p>
        )}
        {state.posts.map((p) => (
          <div className="post-item" key={p.id}>
            <div className="post-head">
              <span className="post-type">
                {POST_TYPE_MAP[p.type].icon} {POST_TYPE_MAP[p.type].label}
              </span>
              <span className="post-week">Wk {p.week}</span>
            </div>
            <p className="post-text">{p.text}</p>
            <span className="post-gain">
              {p.viral && '🔥 Viral · '}+{p.followersGained.toLocaleString()} followers · ❤️{' '}
              {Math.round(p.followersGained * 2).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
