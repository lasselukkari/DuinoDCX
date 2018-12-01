import React, {PureComponent} from 'react';
import Dropzone from 'react-dropzone';
import Request from 'superagent';
import {ProgressBar, Button} from 'react-bootstrap';
import Spinner from 'react-spinkit';
import * as compareVersions from 'compare-versions';

class Upload extends PureComponent {
  constructor() {
    super();
    this.state = {};
  }

  fetchVersion() {
    return fetch('/api/version', {credentials: 'same-origin'})
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return response;
      })
      .then(response => response.json())
      .then(version => {
        this.setState({version});
      });
  }

  fetchReleases() {
    return fetch('https://api.github.com/repos/lasselukkari/DuinoDCX/releases')
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return response;
      })
      .then(response => response.json())
      .then(releases => {
        this.setState({releases});
      });
  }

  componentDidMount() {
    this.fetchVersion().catch(console.log);
    this.fetchReleases().catch(console.log);
  }

  handleDrop = acceptedFiles => {
    this.setState({uploading: 'active'});

    Request.post('/api/update')
      .send(acceptedFiles[0])
      .on('progress', ({percent}) => this.setState({percent}))
      .end(err => {
        if (err) {
          this.setState({uploading: 'fail'});
        } else {
          this.setState({uploading: 'success'});
        }

        this.setState({percent: 0});
      });
  };

  statusMessage() {
    const {uploading, percent} = this.state;

    switch (uploading) {
      case 'active':
        return (
          <ProgressBar
            active
            bsStyle="info"
            now={percent}
            label={`${percent ? percent.toFixed(2) : 0.0}%`}
          />
        );
      case 'fail':
        return 'Uploading failed. Check the file and try again.';
      case 'success':
        return 'Uploading succeeded. Hard refresh the page to empty cached files.';
      default:
        return 'Drag and drop a file or click to open the file dialog.';
    }
  }

  getNewRelease({version}, releases) {
    const release = releases[0];

    if (!release) {
      return;
    }

    const {browser_download_url: link, name} = release.assets.filter(
      asset => asset.name === `duinodcx-${release.tag_name}.bin`
    )[0];

    if (!link || !name) {
      return;
    }

    return {
      link,
      name,
      isLatest: compareVersions(release.tag_name, version) === 0
    };
  }

  static renderRelease(release) {
    if (release.isLatest) {
      return <p>Latest firmware installed</p>;
    }
    return (
      <div>
        <p>New release found: {release.name}.</p>
        <Button href={release.link} bsStyle="success">
          Download
        </Button>
      </div>
    );
  }

  render() {
    const {version, releases} = this.state;
    let latestRelease;

    if (version && releases) {
      latestRelease = this.getNewRelease(version, releases);
    }

    if (!version) {
      return (
        <Spinner
          className="text-center"
          fadeIn="none"
          name="line-scale"
          color="#3498DB"
        />
      );
    }

    return (
      <div>
        <Dropzone
          style={{
            width: '100%',
            height: '45px',
            padding: '10px',
            borderWidth: 2,
            borderColor: '#666',
            borderStyle: 'dashed',
            borderRadius: 5
          }}
          activeStyle={{
            borderStyle: 'solid',
            borderColor: '#62C462',
            backgroundColor: '#3e444c'
          }}
          multiple={false}
          onDrop={this.handleDrop}
        >
          {this.statusMessage()}
        </Dropzone>
        <br />
        <div className="text-center">
          <p>
            Current version: {version.version}, {version.buildDate}
          </p>
          {latestRelease && Upload.renderRelease(latestRelease)}
        </div>
      </div>
    );
  }
}

export default Upload;
