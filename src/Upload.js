import React, {PureComponent} from 'react';
import Dropzone from 'react-dropzone';
import Request from 'superagent';
import {ProgressBar} from 'react-bootstrap';
import Spinner from 'react-spinkit';

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

  componentDidMount() {
    this.fetchVersion().catch(console.log);
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

  render() {
    const {version} = this.state;

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
          disablePreview
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
          Current version: {version.version}, {version.buildDate}
        </div>
      </div>
    );
  }
}

export default Upload;
