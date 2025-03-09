/**
 * @param {import('browsertime').BrowsertimeContext} context
 * @param {import('browsertime').BrowsertimeCommands} commands
 */
export default async function(context, commands) {

    // Check whether we have cookie clicking instructions available
    var cookie = [];
    if(!!context.options.cookie) {
      cookie = context.options.cookie.split('|');
    }

    const seleniumWebdriver = context.selenium.webdriver;
    const By = seleniumWebdriver.By;
    const seleniumDriver = context.selenium.driver;

    // Start measurement, non-cached version
    await commands.navigate('about:blank');
    await commands.measure.start(context.options.url.substring(8) + ' [' + context.options.suffix + 'F]');
    await commands.navigate(context.options.url);

    // Click cookie banner buttons, as instructed
    try {
      for(let c of cookie) {

        // Check whether we need to handle buttons inside an iframe
        if(c.indexOf("^") != -1) {
	  let ic = c.split("^");

	  // Find the iframe
	  await commands.wait.bySelector(ic[0], 3000);
	  let iframe = await seleniumDriver.findElement(By.css(ic[0]));

	  // Switch to iframe and find button
	  await seleniumDriver.switchTo().frame(iframe);
	  let clickable = await seleniumDriver.findElement(By.css(ic[1]));
	  await clickable.click();

	  // Switch back to original frame
	  await seleniumDriver.switchTo().defaultContent();
	}

	// Check whether we need to handle buttons inside a shadow root
	else if(c.indexOf(";") != -1) { 
	  let sc = c.split(";");

	  // Find the shadow root
	  await commands.wait.bySelector(sc[0], 3000);
	  let src = await seleniumDriver.findElement(By.css(sc[0]));
	  let sr = await src.getShadowRoot(src);

	  // Another shadow root inside the first one
	  if(sc.length == 3) {
	    src = await sr.findElement(By.css(sc[1]));
	    sr = await src.getShadowRoot(src);
	    sc.shift();
	  }

	  // Find button inside shadow root
	  let clickable = await sr.findElement(By.css(sc[1]));
	  await clickable.click();
	}
	    
	// No iframe or shadow root, just find the button    
	else {
	  await commands.wait.bySelector(c, 3000);
          await commands.click.bySelector(c);
	}
	await commands.wait.byTime(1000);
      }
    }
    catch(e) {
      context.log.error(e.name);
      context.log.error(e.message);
    }

    // Give time for the browser to load / resettle things after cookies have been dealt with
    await commands.wait.byTime(2000);

    // Scroll to bottom, if needed
    if(context.options.scroll > 0) {
      await commands.scroll.toBottom(context.options.scroll);
    }
    await commands.measure.stop();

    // Measure cached version
    await commands.navigate('about:blank');
    await commands.measure.start(context.options.url.substring(8) + ' [' + context.options.suffix + 'c]');
    await commands.navigate(context.options.url);

    if(context.options.scroll > 0) {
      await commands.scroll.toBottom(context.options.scroll);
    }
    return commands.measure.stop();
};
