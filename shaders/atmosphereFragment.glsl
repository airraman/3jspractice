uniform vec3 color1;
uniform vec3 color2;
uniform float mixRatio;

varying vec3 vertexNormal;

void main() {
    float intensity = pow(.6 - dot(vertexNormal, vec3(0,0,1)), 2.0);
    
    // Mix between the two colors based on mixRatio
    vec3 finalColor = mix(color1, color2, mixRatio);
    
    gl_FragColor = vec4(finalColor, 1.0) * intensity;
}