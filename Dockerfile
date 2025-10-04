FROM quay.io/lyfe00011/md:beta
RUN git clone https://github.com/teyepeee/aff_selection.git /root/aff_selection/
WORKDIR /root/aff_selection/
RUN yarn install
CMD ["npm", "start"]
