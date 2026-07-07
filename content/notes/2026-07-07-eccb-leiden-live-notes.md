---
title: ECCB Leiden - Live Notes
date: 2026-07-07
tags:
  - ECCB
---
In this note, I will be hoping to maintain live notes on the ECCB conference sessions. 

## Nathalie Pettoreli (ZSL) - Plenary Talk

[Nathalie](https://www.zsl.org/about-zsl/our-people/prof-nathalie-pettorelli) is a professor at [ZSL](https://www.zsl.org/?gclsrc=aw.ds&gad_source=1&gad_campaignid=9831553624&gbraid=0AAAAAD2k6sQTbTJUta6WgNGsSoPQT5wTS&gclid=CjwKCAjwx7LSBhB3EiwAjcodxHjH7FBquO1OjxDqB26ha7RXkrtNh841Xmz0o0fz9_4PDCDavAjIshoCTysQAvD_BwE), we have previously collaborated on my paper on the future of AI in conservation.

![](</images/notes/Image (22).jpeg>)

*Image: Nathalie's Plenary in the main lecture hall at ECCB*

She made a few points throughout her talk:

Ecosystems are a key concept that is often overlooked in our conception and messaging on biodiversity - its functioning is what links everything together. We need to move away from the idea that saving biodiversity means divorcing people from the landscape, until we do that we are going to struggle to convince people to save biodiversity. We need to focus a lot more on solutions, rather than just gathering more data on how species are declining. She made a specific shout out to [Bill](https://www.zoo.cam.ac.uk/people/william-sutherland-cbe-frs) - and how we need to focus a lot more on the effectiveness of conservation action.

The main thrust of the talk focused on how and why it is important to align with policy, and the types of people that we need in conservation:

Having more data about species is not the only answer to the biodiversity crisis - all the data in the world without the mechanisms to implement change and consideration of the social aspects of conservation, will mean we will go nowhere

Nathalie introduced her paper '[Ecology fit for a crisis](https://doi.org/10.1016/j.tree.2025.11.012)' - identifying the roles for people in solving the biodiversity crisis from the communicator, to the theoretician to the adapter. This presents an interesting framework for thinking about our role in communicating and 'solving' the biodiversity crisis. 

In closing, Nathalie she offered the following points:

- Nature matters everywhere, in urban environments and isolated landscapes - ranking nature based on people absence is not helping our effectiveness.
- We need to move beyond placebased solutions. This requires thinking about land tenure and rights, financial incentives and other mechanisms that directly impact GHG and biodiversity loss
- Policy impact is not just being cited in the GBF
- Biodiversity science of tomorrow calls for attracting and training more boundary spanners, capable to operate across disciplines as well as strengthening of our science to policy pathways - effectiveness needs specialists AND generalists.
- Siloes hamper effectiveness; breaking siloes starts with engaging with spaces where we are not expected.

## Session 1 - Automated detection for conservation

A series of talks looking at detextion in the environment, from audio, to video, to images, to geospatial models. 

### Upscaling biodiversity monitoring with machine listening - [Dr Leonie Baier](https://www.naturalis.nl/en/leonie-baier)

The algorithms are no longer the biggest challenge - but it is the data that they learn from. Monitoring capacity is not keeping up with the scale of the biodiversity challenge. 

Many taxons are vocally active, machine listening can be ubiquitous and continuous, that is cheaper than using human surveying efforts. 

However, we are frequently confronted by the long-tailed problem, some species we know a lot about, but a long tail of species which are data deficient. Some species are easy to record with non-specialist equipment, i.e., birds, but species like bats, the data is less abundantly available.  Also, models trained with perfect data of recordings in quiet environments, can struggle to train models that are listening with different background noise. To get around this, one way would be to have better 'strong labels' - these are human annotated data sources so that the key identifying signatures are more easily identified:

![](</images/notes/Image (23).jpeg>)

 They are working with [xeno-canto.org](http://xeno-canto.org) to help make the shift from weak labels to strong labels. In her questions, she made the case that there needs to be a standardised way of labelling data that expands across projects to improve the strong labelling efforts. This applies even to weak background sounds that are hard to identify by most experts, even labelling the sound as 'too weak to identify' would be a useful label. 

### Understanding the spatial vatiation of hunting pressure in the Chiquitano region via acoustic gunshot detecting - [Francesco Bini](https://www.linkedin.com/in/francesco-bini-a99073229/)

Chiquitano is the largest tropical broadleaf forest in peru. There are regional issues with hunting - they set out to be find out if they can use auidomoth devices to identify gunshots to survey hunting pressures accross the region. 

![](</images/notes/Image (24).jpeg>)

Filtering positive detections took a lot of time, they used the hardRain R package to identify clips which contained heavy rain, which triggered the audio. Also, sometimes there were triggers from species noise, which were then to be checked to see if there were gunshots in the background, as they didnt want to miss any files containing gunshots. 

In an attempt to model hunting pressure, they found that the presence of woodlands was one of the main drivers of gunshot probability. Access from and distance from settlements, towns, cities and roads may have an effect, but it is uncertain. 

### High-throughput biodiversity monitoring with AI species identification in support of the EU Nature Directives - [Niels Raes](https://www.linkedin.com/in/niels-raes-3bab121/)

They want to enable mangers of Natura 2000 sites to be helped by high throughput data monitoring for biodiversity and decision making. 

They use the [ARISE Digital Species Identification system](https://www.arise-biodiversity.nl/post/digital-species-identification), which contains data for multiple species and taxons. Uploading and assessing your results through this platform automatically links with [GBIF](https://www.gbif.org/). This system has tutorials for managers so that they can learn how to use the platform and add their data. You can even link your monitors straight to the platform, and use it as a place to look at and assess your data. 

You have a drop-down of models, and computing resources, that you can use to analyse your data. This includes image and audio analysis. It guides you through the curation of your dataset, the removal of images of people and cars, and allows you to evaluate the models performance on your dataset. 

The key thing is that it also links with [GBIF](https://www.gbif.org/) to make sure that your data is FAIR and is contributing to the broader understanding of biodiversity. 

![](</images/notes/Image (25).jpeg>)

### Upscaling an Essential Biodiversity Variable using ariel and satellite remote sensing on an oceanic island - [Dr Samantha Suter](https://www.unine.ch/conservation-biology/dr-samantha-suter/)



&nbsp;