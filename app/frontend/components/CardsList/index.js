import React, { Component } from "react"
import classNames           from "classnames"
import * as qs              from "qs"
import SortSelect           from "./SortSelect"
import OptionCheckbox       from "./OptionCheckbox"
import ScoresResult         from "./ScoresResult"
import UsersResult          from "./UsersResult"
import Pagination           from "../commons/Pagination"
import * as cardsListUtils  from "./cardsListUtils"
import * as utils           from "../../utils"
import { history }          from "../../utils/browser-dependencies"
import * as api             from "../../api"
import * as path            from "../../utils/path"

export default class CardsList extends Component {
  constructor(props) {
    super(props)
    const { type, location } = props
    const query = qs.parse(location.search.substr(1))
    this.state = {
      query:   cardsListUtils.setDefault(query, type),
      result:  [],
      loading: true
    }
    this.handleSearch(type, this.state.query)
  }
  handleSearch = (type, query) => (
    api[type](
      { query: qs.stringify(query), userName: this.props.userName },
      ({ data: { result, total_count: totalCount, current_page: currentPage, total_pages: totalPages } }) => {
        this.setState({ result, totalCount, currentPage, totalPages, loading: false })
        const { label } = this.props
        if (label) {
          const { query: { word } } = this.state
          const title = word ? `検索: ${word}` : `${label}一覧`
          utils.setMeta(title, "", this.props.history)
        }
      },
      (errors) => this.props.history.push(path.root, utils.setFlashError(errors))
    )
  )
  handlePush = (type, query) => {
    const searchPath = path.search(qs.stringify(query))
    history.pushState("", "", searchPath)
    this.setState({ loading: true, result: [] })
    this.handleSearch(type, query)
  }

  updateQuery = (params) => {
    this.setState(prevState => ({ query: Object.assign({}, prevState.query, params) }))
  }
  handleInputWord = (e) => this.updateQuery({ word: e.target.value })
  handleChangeOption = (key, value) => {
    const { query } = this.state
    if (key) query[key] = value
    if (key !== "page") delete query.page
    this.handlePush(this.props.type, query)
  }
  handleKeyDown = (e) => {
    if (e.keyCode === 13) this.handleChangeOption()
  }
  handlePaginate = (page) => this.handleChangeOption("page", page)

  render() {
    const { query, result, totalCount, currentPage, totalPages, loading } = this.state
    const { word, sort } = query
    const { type, unit, options, customClass } = this.props
    const searchResult = () => {
      switch (type) {
        case "scores":     return <ScoresResult word={word} scores={result} />
        case "favs":       return <ScoresResult word={word} scores={result} />
        case "userScores": return <ScoresResult word={word} scores={result} noAuthor />
        case "users":      return <UsersResult  word={word} users={result} />
        default:           return ""
      }
    }
    const renderOptions = () => (
      options.map(option => (
        <OptionCheckbox
          key={option.key}
          option={option}
          value={query[option.key]}
          handleChangeOption={this.handleChangeOption}
        />
      ))
    )
    const renderPageCount = (current = true) => {
      const perPage = 20
      const firstCount = (perPage * (currentPage - 1)) + 1
      const lastCount = perPage * currentPage > totalCount ? totalCount : perPage * currentPage
      const currentCount = current && totalPages > 1 && currentPage <= totalPages ? (
        <span>
          <span>{firstCount} - {lastCount}</span>
          <span className="separator">/</span>
          <strong>{totalCount}</strong>
        </span>
      ) : (
        <strong>{totalCount}</strong>
      )
      return (
        <span>
          {currentCount}
          <span className="unit">{unit}</span>
        </span>
      )
    }
    const renderPagination = () => (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePaginate={this.handlePaginate}
      >
        <div className="hits is-only-mobile">
          {renderPageCount(false)}
        </div>
      </Pagination>
    )
    return (
      <div className={classNames("search", { "loading-wrapper": loading, [customClass]: customClass })}>
        <div className="field is-grouped search-control">
          <div className="control search-input has-icons-left">
            <span className="icon is-left">
              <i className="fa fa-search" />
            </span>
            <input
              className="input"
              type="text"
              placeholder="search..."
              value={word}
              onChange={this.handleInputWord}
              onKeyDown={this.handleKeyDown}
            />
          </div>
          <div className="control is-hidden-mobile has-icons-left">
            <SortSelect sort={sort} type={type} handleChangeOption={this.handleChangeOption} />
          </div>
          <div className="control options is-hidden-mobile">
            {renderOptions()}
          </div>
          <div className="control hits is-hidden-mobile">
            {renderPageCount()}
          </div>
        </div>

        <div className="field is-grouped is-only-mobile">
          <div className="control has-icons-left">
            <SortSelect sort={sort} type={type} handleChangeOption={this.handleChangeOption} />
          </div>
          <div className="control options">
            {renderOptions()}
          </div>
        </div>

        {renderPagination()}
        {searchResult()}
        {renderPagination()}
      </div>
    )
  }
}
