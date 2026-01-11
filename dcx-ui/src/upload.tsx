import {compareVersions} from 'compare-versions';
import {useState, useEffect, useCallback} from 'react';
import Button from 'react-bootstrap/Button';
import Dropzone from 'react-dropzone';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';
import {toast} from 'react-toastify';

type UploadProps = Record<string, never>;

type Version = {
  version: string;
  buildDate: string;
};

type Release = {
  tag_name: string;
  assets: Array<{name: string; browser_download_url?: string}>;
};

function Upload(_props: UploadProps) {
  const [version, setVersion] = useState<Version | undefined>(undefined);
  const [releases, setReleases] = useState<Release[] | undefined>(undefined);
  const [uploading, setUploading] = useState<string | undefined>(undefined);
  const [percent, setPercent] = useState(0);

  const fetchVersion = useCallback(async () => {
    try {
      const response = await fetch('/api/version', {
        credentials: 'same-origin',
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const ver = (await response.json()) as Version;
      setVersion(ver);
    } catch {
      if (!toast.isActive('fetch-failed-version')) {
        toast.error(`Fetching firmware version failed.`, {
          position: 'bottom-left',
          toastId: 'fetch-failed-version',
        });
      }
    }
  }, []);

  const fetchReleases = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.github.com/repos/lasselukkari/DuinoDCX/releases',
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const rels = (await response.json()) as Release[];
      setReleases(rels);
    } catch {
      // Silent fail as in original
    }
  }, []);

  useEffect(() => {
    void fetchVersion();
    void fetchReleases();
  }, [fetchVersion, fetchReleases]);

  const handleDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    setUploading('active');

    // Using XMLHttpRequest for progress events as in original
    const request = new XMLHttpRequest();

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const pct = (event.loaded / event.total) * 100;
        setPercent(pct);
      }
    });

    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        setUploading('success');
      } else {
        setUploading('fail');
      }

      setPercent(0);
    });

    request.addEventListener('error', () => {
      setUploading('fail');
      setPercent(0);
    });

    request.open('POST', '/api/update');
    request.send(acceptedFiles[0]);
  };

  const renderStatusMessage = () => {
    switch (uploading) {
      case undefined:
      case 'active': {
        return (
          <ProgressBar
            animated
            style={{height: '20px'}}
            variant="info"
            now={percent}
            label={`${percent ? percent.toFixed(2) : 0}%`}
          />
        );
      }

      case 'fail': {
        return 'Uploading failed. Check the file and try again.';
      }

      case 'success': {
        return 'Uploading succeeded. Device will reboot now.';
      }

      default: {
        return 'Drag and drop a file or click to open the file dialog.';
      }
    }
  };

  const getNewRelease = (currentVer: Version, allReleases: Release[]) => {
    const release = allReleases[0];

    if (!release) {
      return undefined;
    }

    const asset = release.assets.find(
      (a) => a.name === `duinodcx-${release.tag_name}.bin`,
    );

    if (!asset?.browser_download_url || !asset.name) {
      return undefined;
    }

    // CurrentVer.version might need handling if it contains 'v' prefix vs tag etc.
    // Assuming compareVersions handles standard semver.
    // Original used `compareVersions(release.tag_name, version) === 0`?
    // Wait, original: `compareVersions(release.tag_name, version) === 0`
    // Wait, `version` object was passed in? `const { version } = this.state;`
    // In `getNewRelease({ version }, releases)` argument structure.
    // `currentVer` is object `{ version: "...", buildDate: "..." }`.
    // So it should be `currentVer.version`.

    // original: `const { browser_download_url: link, name } = release.assets.filter(...)`

    const isLatest =
      compareVersions(release.tag_name, currentVer.version) === 0;

    return {
      link: asset.browser_download_url,
      name: asset.name,
      isLatest,
    };
  };

  const renderRelease = (release: {
    link?: string;
    name?: string;
    isLatest: boolean;
  }) => {
    if (release.isLatest) {
      return <p>Latest firmware installed</p>;
    }

    if (!release.link || !release.name) {
      return undefined;
    }

    return (
      <div>
        <p>New release found: {release.name}.</p>
        <Button href={release.link} variant="success">
          Download
        </Button>
      </div>
    );
  };

  let latestRelease;
  if (version && releases && releases.length > 0) {
    latestRelease = getNewRelease(version, releases);
  }

  if (!version) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <Dropzone multiple={false} onDrop={handleDrop}>
        {({getRootProps, getInputProps}) => (
          <div
            style={{
              width: '100%',
              height: '45px',
              padding: '10px',
              borderWidth: 2,
              borderColor: '#666',
              borderStyle: 'dashed',
              borderRadius: 5,
            }}
            {...getRootProps()}
          >
            {renderStatusMessage()}
            <input {...getInputProps()} />
          </div>
        )}
      </Dropzone>
      <br />
      <div className="text-center">
        <p>
          Current version: {version.version}, {version.buildDate}
        </p>
        {latestRelease ? renderRelease(latestRelease) : undefined}
      </div>
    </div>
  );
}

export default Upload;
