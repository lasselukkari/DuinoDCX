import * as compareVersions from 'compare-versions';
import React, {PureComponent} from 'react';
import Button from 'react-bootstrap/Button';
import Dropzone from 'react-dropzone';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Request from 'superagent';
import Spinner from 'react-spinkit';
import {toast} from 'react-toastify';

class Upload extends PureComponent {
  state = {};

  componentDidMount() {
    this.fetchVersion();
    this.fetchReleases();
  }

  async fetchVersion() {
    try {
      const response = await fetch('/api/version', {
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const version = await response.json();

      this.setState({version});
    } catch {
      toast.error(`Fetching firmware version failed.`, {
        position: toast.POSITION.BOTTOM_LEFT
      });
    }
  }

  async fetchReleases() {
    try {
      const response = fetch(
        'https://api.github.com/repos/lasselukkari/DuinoDCX/releases'
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const releases = await response.json();

      this.setState({releases});
    } catch {}
  }

  handleDrop = (acceptedFiles) => {
    this.setState({uploading: 'active'});

    Request.post('/api/update')
      .send(acceptedFiles[0])
      .on('progress', ({percent}) => this.setState({percent}))
      .end((err) => {
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
            animated
            style={{height: '20px'}}
            variant="info"
            now={percent}
            label={`${percent ? percent.toFixed(2) : 0}%`}
          />
        );
      case 'fail':
        return 'Uploading failed. Check the file and try again.';
      case 'success':
        return 'Uploading succeeded. Device will reboot now.';
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
      (asset) => asset.name === `duinodcx-${release.tag_name}.bin`
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
        <Button href={release.link} variant="success">
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
        <Dropzone multiple={false} onDrop={this.handleDrop}>
          {({getRootProps, getInputProps}) => (
            <div
              style={{
                width: '100%',
                height: '45px',
                padding: '10px',
                borderWidth: 2,
                borderColor: '#666',
                borderStyle: 'dashed',
                borderRadius: 5
              }}
              {...getRootProps()}
            >
              {this.statusMessage()}
              <input {...getInputProps()} />
            </div>
          )}
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
