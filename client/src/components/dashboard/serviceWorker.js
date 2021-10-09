
// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://bit.ly/CRA-PWA

const isLocalhost = Boolean(
	window.location.hostname === 'localhost' ||
		// [::1] is the IPv6 localhost address.
		window.location.hostname === '[::1]' ||
		// 127.0.0.0/8 are considered localhost for IPv4.
		window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
	if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
		console.log('register worker')
		// The URL constructor is available in all browsers that support SW.
		const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
		if (publicUrl.origin !== window.location.origin) {
			// Our service worker won't work if PUBLIC_URL is on a different origin
			// from what our page is served on. This might happen if a CDN is used to
			// serve assets; see https://github.com/facebook/create-react-app/issues/2374
			console.log('register worker. terminated')
			return;
		}

		window.addEventListener('load', () => {
			const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

			if (isLocalhost) {
				// This is running on localhost. Let's check if a service worker still exists or not.
				checkValidServiceWorker(swUrl, config);

				// Add some additional logging to localhost, pointing developers to the
				// service worker/PWA documentation.
				navigator.serviceWorker.ready.then((registration) => {
					console.log(
						'This web app is being served cache-first by a service worker. To learn more, visit https://bit.ly/CRA-PWA'
					);
					registration.update().then(()=>{
						console.log('updated')
					})
				});
			} else {
				// Is not localhost. Just register service worker
				registerValidSW(swUrl, config);
			}
		});
	}
}

function registerValidSW(swUrl, config) {
	console.log('register',swUrl)
	navigator.serviceWorker
		.register(swUrl)
		//.register(swUrl)
		.then((registration) => {
			console.log('got registration')
			console.log('active', registration.active ? registration.active.state : false)
			console.log('waiting', registration.waiting ? registration.waiting.state : false)
			if (navigator.vendor === 'Apple Computer, Inc.') {
				if (registration.waiting) {
					if (config && config.onUpdate) {
						if(registration.waiting.state !== 'installed'){
							config.onUpdate(registration);
						}
						else{
							registration.waiting.postMessage({ type: "SKIP_WAITING" });
							window.location.reload(true)
						}
					}
				}
				if(registration.active)
					console.log('registration active', registration.active.state)
				if(registration.waiting)
					console.log('registration waiting', registration.waiting)
			}
			registration.onupdatefound = () => {
				const installingWorker = registration.installing;
				//const waitingServiceWorker = registration.waiting
				console.log('UPDATE FOUND')
				if (installingWorker == null) {
					return;
				}

				installingWorker.onstatechange = (evt) => {
					if (installingWorker.state === 'installed') {

						if (navigator.serviceWorker.controller) {
							// At this point, the updated precached content has been fetched,
							// but the previous service worker will still serve the older
							// content until all client tabs are closed.
							console.log(
								'New content is available and will be used when all tabs for this page are closed. See https://bit.ly/CRA-PWA.'
							);
							// Execute callback
							if (config && config.onUpdate) {
								if(navigator.serviceWorker.waiting)
									navigator.serviceWorker.waiting.postMessage({ type: "SKIP_WAITING" });
								if(registration.waiting){
									console.log('skip waiting')
									registration.waiting.postMessage({ type: "SKIP_WAITING" });
								}
								config.onUpdate(registration);
							}
						} else {
							// At this point, everything has been precached.
							// It's the perfect time to display a
							// "Content is cached for offline use." message.
							console.log('Content is cached for offline use. what does itmean');

							// Execute callback
							if (config && config.onSuccess) {
								console.log('update installed')
								navigator.serviceWorker.waiting.postMessage({ type: "SKIP_WAITING" });
								config.onSuccess(registration);
							}else{
								window.location.reload(true)
							}
						}
					}
					if(navigator.serviceWorker.waiting)
						navigator.serviceWorker.waiting.postMessage({ type: "SKIP_WAITING" });
				};
				
			    
			};
		})
		.catch((error) => {
			console.error('Error during service worker registration:', error);
		});
}

function checkValidServiceWorker(swUrl, config) {
	// Check if the service worker can be found. If it can't reload the page.
	fetch(swUrl, {
		headers: { 'Service-Worker': 'script' },
	})
		.then((response) => {
			// Ensure service worker exists, and that we really are getting a JS file.
			const contentType = response.headers.get('content-type');
			if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
				// No service worker found. Probably a different app. Reload the page.
				navigator.serviceWorker.ready.then((registration) => {
					registration.unregister().then(() => {
						window.location.reload();
					});
				});
			} else {
				// Service worker found. Proceed as normal.
				registerValidSW(swUrl, config);
			}
		})
		.catch(() => {
			console.log('No internet connection found. App is running in offline mode.');
		});
}

export function unregister() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready
			.then((registration) => {
				registration.unregister();
			})
			.catch((error) => {
				console.error(error.message);
			});
	}
}