uniform vec3 color1;
uniform vec3 color2;
uniform float mixRatio;

varying vec3 vertexNormal;

void main() {
    float intensity = pow(0.8 - dot(normalize(vertexNormal), vec3(0, 0, 1.0)), 2.0);
    vec3 finalColor = mix(color1, color2, mixRatio);
    gl_FragColor = vec4(finalColor, intensity);
}