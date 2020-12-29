import React from 'react';
import './styles.css';
import axios from 'axios';

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      results: {},
      loading: false,
      message: '',
      previouSearch: [],
    };
    this.cancel = '';
    this.queryNode = React.createRef();
  }
  fetchSearchResult(query) {
    const baseUrl = 'https://app.ticketmaster.com';
    const apiKey = 'QHksN0NRjdho1ZzuO6SMRTae11jAGsZj';
    const searchUrl = `${baseUrl}/discovery/v2/events.json?apikey=${apiKey}&keyword=${query}`;
    const foundInPrev = this.state.previouSearch
      ? this.state.previouSearch.filter((item) => item.id === query)
      : [];

    if (this.cancel) {
      this.cancel.cancel();
    }
    this.cancel = axios.CancelToken.source();

    if (foundInPrev.length > 0) {
      console.log('foundInPrev', foundInPrev[0].results);
      this.setState({
        query,
        results: foundInPrev[0].results,
        loading: false,
        message: '',
      });
    } else {
      axios
        .get(searchUrl, {
          cancelToken: this.cancel.token,
        })
        .then((res) => {
          const resultNotFound = !res.data._embedded.events
            ? 'There are no result found. Please try other keyword'
            : '';
          this.setState({
            query,
            results: res.data._embedded.events,
            loading: false,
            message: resultNotFound,
            previouSearch: [
              ...this.state.previouSearch,
              { id: query, results: res.data._embedded.events },
            ],
          });
          if (this.state.previouSearch.length >= 5) {
            let previouSearch = [...this.state.previouSearch];
            previouSearch.shift();
            this.setState({ previouSearch });
          }
        })
        .catch((error) => {
          if (axios.isCancel(error) || error) {
            this.setState({
              query,
              results: {},
              loading: false,
              message: 'Failed to fetch requested event. Please check network',
            });
          }
        });
    }
  }
  renderSearchResult() {
    const { results } = this.state;
    return (
      results.length > 0 && (
        <div className='results-container'>
          {results.map((result) => {
            const { id, name, images, dates, locale } = result;
            return (
              <div className='result-item' key={id}>
                <img src={images[0].url} alt={name} />
                <div className='event-details'>
                  <div className='event-name'>{name}</div>
                  <div className='event-date'>
                    Date & Venue: {dates.start.localDate}, {locale}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )
    );
  }
  onInputChange(e) {
    const query = e.currentTarget.value;
    if (!query || query.length < 3) {
      this.setState({ query, results: {}, message: '' });
    } else {
      //fetch result
      this.setState({ query, loading: true, message: '' }, () => {
        this.fetchSearchResult(query);
      });
    }
  }
  render() {
    const { loading, message } = this.state;
    return (
      <div className='container'>
        <h2 className='heading'>Events Search</h2>
        <label className='search-label' htmlFor='search-input'>
          <input
            type='text'
            name='query'
            id='search-input'
            placeholder='Search...'
            onChange={(e) => this.onInputChange(e)}
            ref={this.queryNode}
          />
          <i className='fas fa-search search-icon' aria-hidden='true'></i>
        </label>
        {message && <p className='message'>{message}</p>}
        <div className='search-loading'>
          <i
            className={`fas fa-spinner fa-spin fa-5x search-spinner ${
              loading ? 'show' : 'hide'
            }`}
          ></i>
        </div>
        {this.renderSearchResult()}
      </div>
    );
  }
}

export default Search;
